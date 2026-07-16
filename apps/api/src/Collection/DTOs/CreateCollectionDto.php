<?php

declare(strict_types=1);

namespace App\Collection\DTOs;

final readonly class CreateCollectionDto
{
    public function __construct(
        public string $name,
        public ?string $parentId = null,
    ) {
    }
}
