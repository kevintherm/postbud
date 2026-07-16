<?php

declare(strict_types=1);

namespace App\User\DTOs;

class RegisterDto
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        #[\SensitiveParameter]
        public readonly string $password,
    ) {
    }
}
