<?php

declare(strict_types=1);

namespace App\Auth\Middleware;

use App\User\Models\User;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Response;

class AuthMiddleware implements MiddlewareInterface
{
    public function __construct(private readonly EntityManagerInterface $entityManager)
    {
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $authHeader = $request->getHeaderLine('Authorization');
        
        if (empty($authHeader)) {
            return $this->unauthorized();
        }

        $parts = explode(' ', $authHeader);
        if (count($parts) !== 2 || strtolower($parts[0]) !== 'bearer') {
            return $this->unauthorized();
        }

        $token = $parts[1];
        $user = $this->entityManager->getRepository(User::class)->findOneBy(['token' => $token]);

        if ($user === null) {
            return $this->unauthorized();
        }

        $request = $request->withAttribute('user', $user);

        return $handler->handle($request);
    }

    private function unauthorized(): ResponseInterface
    {
        $response = new Response();
        $response->getBody()->write(json_encode(['error' => 'Unauthorized']));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus(401);
    }
}
