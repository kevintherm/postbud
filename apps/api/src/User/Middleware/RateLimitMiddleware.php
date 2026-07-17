<?php

declare(strict_types=1);

namespace App\User\Middleware;

use App\User\Services\JwtService;
use Override;
use Psr\Cache\CacheItemPoolInterface;
use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

final class RateLimitMiddleware implements MiddlewareInterface
{
    public function __construct(
        private readonly JwtService $jwtService,
        private readonly CacheItemPoolInterface $cache,
        private readonly ResponseFactoryInterface $responseFactory,
    ) {
    }

    #[Override]
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $authHeader = $request->getHeaderLine('Authorization');
        $isAuthenticated = false;

        if (str_starts_with($authHeader, 'Bearer ')) {
            $token = substr($authHeader, 7);
            $payload = $this->jwtService->decode($token);
            if ($payload !== null && isset($payload['sub'])) {
                $isAuthenticated = true;
            }
        }

        if (!$isAuthenticated) {
            // Apply rate limit of 50req/s for guest users
            /** @var array{REMOTE_ADDR?: string} $serverParams */
            $serverParams = $request->getServerParams();
            $ip = $serverParams['REMOTE_ADDR'] ?? '127.0.0.1';
            $time = time();
            $key = 'ratelimit:' . sha1($ip) . ':' . $time;

            $cacheItem = $this->cache->getItem($key);
            if (!$cacheItem->isHit()) {
                $count = 1;
                $cacheItem->set($count);
                $cacheItem->expiresAfter(5);
                $this->cache->save($cacheItem);
            } else {
                /** @var mixed $cachedValue */
                $cachedValue = $cacheItem->get();
                $count = is_numeric($cachedValue) ? (int) $cachedValue : 0;
                $count++;
                $cacheItem->set($count);
                $this->cache->save($cacheItem);
            }

            if ($count > 50) {
                $response = $this->responseFactory->createResponse(429);
                $body = (string) json_encode([
                    'error' => 'Too Many Requests',
                    'message' => 'Guest rate limit of 50 requests per second exceeded.',
                ]);
                $response->getBody()->write($body);

                return $response
                    ->withHeader('Content-Type', 'application/json')
                    ->withHeader('Retry-After', '1');
            }
        }

        return $handler->handle($request);
    }
}
