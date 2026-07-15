<?php

declare(strict_types=1);

namespace App\User\Middleware;

use Override;
use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

final class CorsMiddleware implements MiddlewareInterface
{
    /** @var array<string> */
    private array $allowedOrigins;

    /**
     * @psalm-suppress PossiblyUnusedMethod
     * @param array<string> $allowedOrigins Pass ['*'] to allow all origins.
     */
    public function __construct(
        private readonly ResponseFactoryInterface $responseFactory,
        array $allowedOrigins = ['*']
    ) {
        $this->allowedOrigins = $allowedOrigins;
    }

    #[Override]
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $origin = $request->getHeaderLine('Origin');

        // Handle preflight OPTIONS request immediately.
        if ($request->getMethod() === 'OPTIONS') {
            $response = $this->responseFactory->createResponse(204);
            return $this->withCorsHeaders($response, $origin);
        }

        $response = $handler->handle($request);

        return $this->withCorsHeaders($response, $origin);
    }

    private function withCorsHeaders(ResponseInterface $response, string $origin): ResponseInterface
    {
        $allowOrigin = $this->resolveAllowedOrigin($origin);

        return $response
            ->withHeader('Access-Control-Allow-Origin', $allowOrigin)
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
            ->withHeader('Access-Control-Allow-Credentials', 'true')
            ->withHeader('Access-Control-Max-Age', '86400');
    }

    private function resolveAllowedOrigin(string $origin): string
    {
        if (in_array('*', $this->allowedOrigins, true)) {
            return $origin ?: '*';
        }

        if ($origin !== '' && in_array($origin, $this->allowedOrigins, true)) {
            return $origin;
        }

        return $this->allowedOrigins[0] ?? '*';
    }
}
