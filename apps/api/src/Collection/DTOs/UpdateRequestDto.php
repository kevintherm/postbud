<?php

declare(strict_types=1);

namespace App\Collection\DTOs;

final readonly class UpdateRequestDto
{
    /**
     * @param array<int, array<string, mixed>>|null $headers
     * @param array<int, array<string, mixed>>|null $params
     * @param array<string, mixed>|null $body
     */
    public function __construct(
        public ?string $name = null,
        public ?string $method = null,
        public ?string $url = null,
        public ?array $headers = null,
        public ?array $params = null,
        public ?array $body = null,
        public ?int $sortOrder = null,
        public ?string $collectionId = null,
    ) {
    }
}
