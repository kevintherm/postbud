<?php

declare(strict_types=1);

namespace App\User\Services;

use Stout\Config\Config;

final class JwtService
{
    private string $secret;

    /** Token lifetime in seconds (30 days). */
    private int $ttl;

    /**
     * @psalm-suppress PossiblyUnusedMethod
     */
    public function __construct(private Config $config, int $ttl = 2592000)
    {
        /**
         * @psalm-suppress MixedAssignment
         * @psalm-suppress RedundantCondition
         * @psalm-suppress TypeDoesNotContainType
         */
        $raw = $config->require('jwt.secret');
        $this->secret = is_string($raw) ? $raw : 'postbud-secret-change-me-in-production';
        $this->ttl = $ttl;
    }

    /** Encode a signed JWT for the given user ID. */
    public function encode(int $userId): string
    {
        $header  = $this->base64url((string) json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        $payload = $this->base64url((string) json_encode([
            'sub' => $userId,
            'iat' => time(),
            'exp' => time() + $this->ttl,
        ]));
        $signature = $this->base64url(
            hash_hmac('sha256', "$header.$payload", $this->secret, true)
        );

        return "$header.$payload.$signature";
    }

    /**
     * Decode and verify a JWT. Returns the payload array or null if invalid/expired.
     *
     * @return array<string, mixed>|null
     */
    public function decode(string $token): ?array
    {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            return null;
        }

        [$header, $payload, $signature] = $parts;

        $expected = $this->base64url(hash_hmac('sha256', "$header.$payload", $this->secret, true));

        if (!hash_equals($expected, $signature)) {
            return null;
        }

        $data = json_decode($this->base64urlDecode($payload), true);

        if (!is_array($data)) {
            return null;
        }

        $exp = $data['exp'] ?? null;
        if (is_int($exp) && $exp < time()) {
            return null;
        }

        return $data;
    }

    private function base64url(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function base64urlDecode(string $data): string
    {
        return (string) base64_decode(strtr($data, '-_', '+/'));
    }
}
