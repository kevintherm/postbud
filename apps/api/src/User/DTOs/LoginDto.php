<?php

declare(strict_types=1);

namespace App\User\DTOs;

class LoginDto
{
    public function __construct(
        public readonly string $email,
        public readonly string $password,
    ) {}
}
