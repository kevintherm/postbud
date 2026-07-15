<?php

declare(strict_types=1);

namespace App\User\Controllers;

use App\User\DTOs\LoginDto;
use App\User\DTOs\RegisterDto;
use App\User\DTOs\UpdateUserDto;
use App\User\Models\User;
use App\User\Services\AuthService;
use App\User\Exceptions\InvalidCredentialsException;
use App\User\Exceptions\ForbiddenException;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use InvalidArgumentException;
use OpenApi\Attributes as OA;
use Stout\Http\Request;
use Stout\Http\Response;

#[OA\Tag(name: 'Users', description: 'User accounts and authentication')]
final class UserController
{
    /**
     * @psalm-suppress PossiblyUnusedMethod
     */
    public function __construct(
        private readonly AuthService $authService
    ) {}

    /**
     * @psalm-suppress PossiblyUnusedMethod
     */
    #[OA\Post(path: '/api/register', summary: 'Register a new user', tags: ['Users'])]
    public function register(Request $request, Response $response): Response
    {
        try {
            $dto = new RegisterDto(
                name: (string) ($request->json('name') ?? ''),
                email: (string) ($request->json('email') ?? ''),
                password: (string) ($request->json('password') ?? ''),
            );

            $result = $this->authService->register($dto);

            return $response->json(['status' => 'created', 'token' => $result['token'], 'user' => $result['user']], 201);
        } catch (InvalidArgumentException $e) {
            return $response->json(['error' => 'Validation failed', 'message' => $e->getMessage()], 422);
        } catch (UniqueConstraintViolationException $e) {
            return $response->json(['error' => 'Conflict', 'message' => $e->getMessage()], 409);
        }
    }

    /**
     * @psalm-suppress PossiblyUnusedMethod
     */
    #[OA\Post(path: '/api/login', summary: 'Authenticate and receive a JWT', tags: ['Users'])]
    public function login(Request $request, Response $response): Response
    {
        try {
            $dto = new LoginDto(
                email: (string) ($request->json('email') ?? ''),
                password: (string) ($request->json('password') ?? ''),
            );

            $result = $this->authService->login($dto);

            return $response->json(['status' => 'success', 'token' => $result['token'], 'user' => $result['user']]);
        } catch (InvalidArgumentException $e) {
            return $response->json(['error' => 'Validation failed', 'message' => $e->getMessage()], 422);
        } catch (InvalidCredentialsException $e) {
            return $response->json(['error' => 'Unauthorized', 'message' => $e->getMessage()], 401);
        }
    }

    /**
     * @psalm-suppress PossiblyUnusedMethod
     */
    #[OA\Get(path: '/api/me', summary: 'Get the authenticated user', tags: ['Users'])]
    public function me(Request $request, Response $response): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('auth_user');

        return $response->json($user);
    }

    /**
     * @psalm-suppress PossiblyUnusedMethod
     * @psalm-suppress UnusedParam
     */
    #[OA\Get(path: '/api/users', summary: 'List all users', tags: ['Users'])]
    public function index(Request $request, Response $response): Response
    {
        $_ = $request;
        $users = $this->authService->listUsers();

        return $response->json(array_map(fn (User $u) => $u->jsonSerialize(), $users));
    }

    /**
     * @psalm-suppress PossiblyUnusedMethod
     * @param array{id: string} $vars
     */
    #[OA\Put(path: '/api/users/{id}', summary: 'Update a user profile', tags: ['Users'])]
    public function update(Request $request, Response $response, array $vars): Response
    {   
        $actorId = (int) $vars['id'];

        /** @var User $authUser */
        $authUser = $request->getAttribute('auth_user');

        try {
            $dto = new UpdateUserDto(
                name: $request->json('name'),
                email: $request->json('email'),
                syncEnabled: $request->json('sync_enabled'),
            );

            $this->authService->updateUser($actorId, $authUser, $dto);

            return $response->json(['status' => 'updated', 'user' => $authUser]);
        } catch (UniqueConstraintViolationException $e) {
            return $response->json(['error' => 'Conflict', 'message' => $e->getMessage()], 409);
        } catch (ForbiddenException $e) {
            return $response->json(['error' => 'Forbidden', 'message' => $e->getMessage()], 403);
        }
    }
}
