<?php

declare(strict_types=1);

namespace App\User\Middleware;

use App\User\Models\User;
use App\User\Services\JwtService;
use Doctrine\ORM\EntityManagerInterface;
use Override;
use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

final class AuthMiddleware implements MiddlewareInterface
{
    /**
     * @psalm-suppress PossiblyUnusedMethod
     */
    public function __construct(
        private readonly JwtService $jwtService,
        private readonly EntityManagerInterface $entityManager,
        private readonly ResponseFactoryInterface $responseFactory
    ) {}

    #[Override]
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $authHeader = $request->getHeaderLine('Authorization');

        if (!str_starts_with($authHeader, 'Bearer ')) {
            return $this->unauthorized('A valid Bearer token is required.');
        }

        $token   = substr($authHeader, 7);
        $payload = $this->jwtService->decode($token);

        if ($payload === null || !isset($payload['sub'])) {
            return $this->unauthorized('Token is invalid or expired.');
        }

        $userId = (int) $payload['sub'];
        $user   = $this->entityManager->find(User::class, $userId);

        if (!$user instanceof User) {
            return $this->unauthorized('Authenticated user no longer exists.');
        }

        return $handler->handle($request->withAttribute('auth_user', $user));
    }

    private function unauthorized(string $message): ResponseInterface
    {
        $response = $this->responseFactory->createResponse(401);
        $body     = (string) json_encode(['error' => 'Unauthorized', 'message' => $message]);
        $response->getBody()->write($body);

        return $response->withHeader('Content-Type', 'application/json');
    }
}
