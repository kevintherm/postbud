<?php

declare(strict_types=1);

namespace App\Auth\Controllers;

use App\User\Models\User;
use Doctrine\ORM\EntityManagerInterface;
use Stout\Http\Request;
use Stout\Http\Response;

class AuthController
{
    public function __construct(private readonly EntityManagerInterface $entityManager)
    {
    }

    public function register(Request $request, Response $response): Response
    {
        $email = $request->json('email', '');
        $password = $request->json('password', '');

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $response->json(['error' => 'Invalid email address'], 400);
        }

        if (strlen($password) < 6) {
            return $response->json(['error' => 'Password must be at least 6 characters'], 400);
        }

        $repo = $this->entityManager->getRepository(User::class);
        $exists = $repo->findOneBy(['email' => $email]);
        if ($exists !== null) {
            return $response->json(['error' => 'email already exists'], 400);
        }

        $user = new User();
        $user->setEmail($email);
        $user->setPassword(password_hash($password, PASSWORD_BCRYPT));
        
        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $response->json([
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
            ]
        ], 201);
    }

    public function login(Request $request, Response $response): Response
    {
        $email = $request->json('email', '');
        $password = $request->json('password', '');

        $repo = $this->entityManager->getRepository(User::class);
        /** @var User|null $user */
        $user = $repo->findOneBy(['email' => $email]);

        if ($user === null || !password_verify($password, $user->getPassword())) {
            return $response->json(['error' => 'Invalid credentials'], 401);
        }

        $token = bin2hex(random_bytes(32));
        $user->setToken($token);
        
        $this->entityManager->flush();

        return $response->json([
            'token' => $token,
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
            ]
        ]);
    }

    public function profile(Request $request, Response $response): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('user');

        return $response->json([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
        ]);
    }
}
