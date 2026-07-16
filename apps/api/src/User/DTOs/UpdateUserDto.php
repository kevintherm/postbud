<?php

declare(strict_types=1);

namespace App\User\DTOs;

class UpdateUserDto
{
    public function __construct(
        public readonly ?string $name = null,
        public readonly ?string $email = null,
        public readonly ?bool $syncEnabled = null,
    ) {
    }
}
