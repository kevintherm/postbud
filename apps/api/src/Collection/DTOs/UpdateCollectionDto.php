<?php

declare(strict_types=1);

namespace App\Collection\DTOs;

final readonly class UpdateCollectionDto
{
    public function __construct(
        public ?string $name = null,
        public ?string $parentId = null,
        public ?int $sortOrder = null,
    ) {
    }
}
