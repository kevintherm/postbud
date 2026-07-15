<?php

declare(strict_types=1);

namespace App\User\Controllers;

use App\User\Models\User;
use App\User\Services\JwtService;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
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
        private readonly EntityManagerInterface $entityManager,
        private readonly JwtService $jwtService
    ) {}

    /**
     * @psalm-suppress PossiblyUnusedMethod
     */
    #[OA\Post(path: '/api/register', summary: 'Register a new user', tags: ['Users'])]
    public function register(Request $request, Response $response): Response
    {
        $name = (string) ($request->json('name') ?? '');
        $email    = (string) ($request->json('email') ?? '');
        $password = (string) ($request->json('password') ?? '');

        if ($name === '' || $email === '' || $password === '') {
            return $response->json(['error' => 'Validation failed', 'message' => 'name, email, and password are required.'], 422);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $response->json(['error' => 'Validation failed', 'message' => 'Invalid email address.'], 422);
        }

        if (strlen($password) < 8) {
            return $response->json(['error' => 'Validation failed', 'message' => 'Password must be at least 8 characters.'], 422);
        }

        $hashed = password_hash($password, PASSWORD_BCRYPT);
        $user   = new User($name, $email, $hashed);

        try {
            $this->entityManager->persist($user);
            $this->entityManager->flush();
        } catch (UniqueConstraintViolationException) {
            return $response->json(['error' => 'Conflict', 'message' => 'A user with that email already exists.'], 409);
        }

        $token = $this->jwtService->encode($user->getId());

        return $response->json(['status' => 'created', 'token' => $token, 'user' => $user], 201);
    }

    /**
     * @psalm-suppress PossiblyUnusedMethod
     */
    #[OA\Post(path: '/api/login', summary: 'Authenticate and receive a JWT', tags: ['Users'])]
    public function login(Request $request, Response $response): Response
    {
        $email    = (string) ($request->json('email') ?? '');
        $password = (string) ($request->json('password') ?? '');

        if ($email === '' || $password === '') {
            return $response->json(['error' => 'Validation failed', 'message' => 'email and password are required.'], 422);
        }

        $user = $this->entityManager
            ->getRepository(User::class)
            ->findOneBy(['email' => $email]);

        if (!$user instanceof User || !password_verify($password, $user->getPassword())) {
            return $response->json(['error' => 'Unauthorized', 'message' => 'Invalid email or password.'], 401);
        }

        $token = $this->jwtService->encode($user->getId());

        return $response->json(['status' => 'success', 'token' => $token, 'user' => $user]);
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
        $users = $this->entityManager->getRepository(User::class)->findAll();

        return $response->json(array_map(fn (User $u) => $u->jsonSerialize(), $users));
    }

    /**
     * @psalm-suppress PossiblyUnusedMethod
     */
    #[OA\Put(path: '/api/users/{id}', summary: 'Update a user profile', tags: ['Users'])]
    public function update(Request $request, Response $response, $vars): Response
    {
        $id = $request->query('id');

        /** @var User $authUser */
        $authUser = $request->getAttribute('auth_user');

        if ($authUser->getId() !== $id) {
            return $response->json(['error' => 'Forbidden', 'message' => 'You can only update your own profile.'], 403);
        }

        $name    = $request->json('name');
        $email       = $request->json('email');
        $syncEnabled = $request->json('sync_enabled');

        if (is_string($name) && $name !== '') {
            $authUser->setName($name);
        }

        if (is_string($email) && filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $authUser->setEmail($email);
        }

        if (is_bool($syncEnabled)) {
            $authUser->setSyncEnabled($syncEnabled);
        }

        try {
            $this->entityManager->flush();
        } catch (UniqueConstraintViolationException) {
            return $response->json(['error' => 'Conflict', 'message' => 'email already taken.'], 409);
        }

        return $response->json(['status' => 'updated', 'user' => $authUser]);
    }
}
