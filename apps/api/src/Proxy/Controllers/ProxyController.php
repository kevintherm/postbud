<?php

declare(strict_types=1);

namespace App\Proxy\Controllers;

use OpenApi\Attributes as OA;
use Stout\Http\Request;
use Stout\Http\Response;

#[OA\Tag(name: 'Proxy', description: 'Server-side HTTP forwarding proxy for the sandbox client')]
final class ProxyController
{
    private const int TIMEOUT_SECONDS = 30;

    /**
     * @psalm-suppress PossiblyUnusedMethod
     */
    #[OA\Post(
        path: '/api/proxy',
        summary: 'Forward an HTTP request from the client sandbox',
        tags: ['Proxy']
    )]
    public function forward(Request $request, Response $response): Response
    {
        $url    = (string) ($request->json('url') ?? '');
        $method = strtoupper((string) ($request->json('method') ?? 'GET'));
        $headers = $request->json('headers') ?? [];
        $body   = (string) ($request->json('body') ?? '');

        if ($url === '') {
            return $response->json(['error' => 'Bad Request', 'message' => 'The "url" field is required.'], 400);
        }

        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return $response->json(['error' => 'Bad Request', 'message' => 'The "url" field must be a valid URL.'], 400);
        }

        $ch = curl_init();

        if ($ch === false) {
            return $response->json(['error' => 'Proxy Error', 'message' => 'curl_init failed.'], 502);
        }

        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_CUSTOMREQUEST  => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HEADER         => true,
            CURLOPT_TIMEOUT        => self::TIMEOUT_SECONDS,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS      => 5,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $curlHeaders = $this->buildCurlHeaders($headers);
        if ($curlHeaders !== []) {
            curl_setopt($ch, CURLOPT_HTTPHEADER, $curlHeaders);
        }

        if (in_array($method, ['POST', 'PUT', 'PATCH'], true) && $body !== '') {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        }

        $raw        = (string) curl_exec($ch);
        $status     = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $error      = curl_error($ch);
        curl_close($ch);

        if ($error !== '') {
            return $response->json(['error' => 'Proxy Error', 'message' => $error], 502);
        }

        $rawHeaders    = substr($raw, 0, $headerSize);
        $responseBody  = substr($raw, $headerSize);
        $parsedHeaders = $this->parseHeaders($rawHeaders);

        return $response->json([
            'status'     => $status,
            'statusText' => $this->statusText($status),
            'headers'    => $parsedHeaders,
            'body'       => $responseBody,
        ]);
    }

    /**
     * @param mixed $headers
     * @return array<string>
     */
    private function buildCurlHeaders(mixed $headers): array
    {
        if (!is_array($headers)) {
            return [];
        }

        $result = [];
        foreach ($headers as $header) {
            if (is_array($header) && isset($header['key'], $header['value']) && ($header['enabled'] ?? true)) {
                $result[] = "{$header['key']}: {$header['value']}";
            }
        }

        return $result;
    }

    /**
     * @return array<array{key: string, value: string}>
     */
    private function parseHeaders(string $rawHeaders): array
    {
        $result = [];
        foreach (explode("\r\n", $rawHeaders) as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, 'HTTP/')) {
                continue;
            }
            $parts = explode(':', $line, 2);
            if (count($parts) === 2) {
                $result[] = ['key' => trim($parts[0]), 'value' => trim($parts[1])];
            }
        }
        return $result;
    }

    private function statusText(int $code): string
    {
        $texts = [
            200 => 'OK', 201 => 'Created', 204 => 'No Content',
            400 => 'Bad Request', 401 => 'Unauthorized', 403 => 'Forbidden',
            404 => 'Not Found', 405 => 'Method Not Allowed', 409 => 'Conflict',
            422 => 'Unprocessable Entity', 500 => 'Internal Server Error',
            502 => 'Bad Gateway', 503 => 'Service Unavailable',
        ];
        return $texts[$code] ?? 'Unknown';
    }
}
