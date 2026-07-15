<?php

declare(strict_types=1);

namespace App\User\Services;

use App\User\DTOs\LoginDto;
use App\User\DTOs\RegisterDto;
use App\User\DTOs\UpdateUserDto;
use App\User\Models\User;
use App\User\Exceptions\InvalidCredentialsException;
use App\User\Exceptions\ForbiddenException;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use InvalidArgumentException;

class AuthService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly JwtService $jwtService
    ) {}

    /**
     * @return array{user: User, token: string}
     */
    public function register(RegisterDto $dto): array
    {
        if ($dto->name === '' || $dto->email === '' || $dto->password === '') {
            throw new InvalidArgumentException('name, email, and password are required.');
        }

        if (!filter_var($dto->email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Invalid email address.');
        }

        if (strlen($dto->password) < 8) {
            throw new InvalidArgumentException('Password must be at least 8 characters.');
        }

        $hashed = password_hash($dto->password, PASSWORD_BCRYPT);
        $user = new User($dto->name, $dto->email, $hashed);

        try {
            $this->entityManager->persist($user);
            $this->entityManager->flush();
        } catch (UniqueConstraintViolationException) {
            throw new UniqueConstraintViolationException('A user with that email already exists.');
        }

        $token = $this->jwtService->encode($user->getId());

        return ['user' => $user, 'token' => $token];
    }

    /**
     * @return array{user: User, token: string}
     */
    public function login(LoginDto $dto): array
    {
        if ($dto->email === '' || $dto->password === '') {
            throw new InvalidArgumentException('email and password are required.');
        }

        $user = $this->entityManager
            ->getRepository(User::class)
            ->findOneBy(['email' => $dto->email]);

        if (!$user instanceof User || !password_verify($dto->password, $user->getPassword())) {
            throw new InvalidCredentialsException();
        }

        $token = $this->jwtService->encode($user->getId());

        return ['user' => $user, 'token' => $token];
    }

    /**
     * @return User[]
     */
    public function listUsers(): array
    {
        return $this->entityManager->getRepository(User::class)->findAll();
    }

    public function updateUser(int $actorId, User $user, UpdateUserDto $dto): void
    {
        if ($actorId !== $user->getId()) {
            throw new ForbiddenException('You can only update your own profile.');
        }
        
        if (is_string($dto->name) && $dto->name !== '') {
            $user->setName($dto->name);
        }

        if (is_string($dto->email) && filter_var($dto->email, FILTER_VALIDATE_EMAIL)) {
            $user->setEmail($dto->email);
        }

        if (is_bool($dto->syncEnabled)) {
            $user->setSyncEnabled($dto->syncEnabled);
        }

        try {
            $this->entityManager->flush();
        } catch (UniqueConstraintViolationException) {
            throw new UniqueConstraintViolationException('email already taken.');
        }
    }
}
