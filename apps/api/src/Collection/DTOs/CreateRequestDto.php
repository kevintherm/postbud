<?php

declare(strict_types=1);

namespace App\Collection\DTOs;

final readonly class CreateRequestDto
{
    /**
     * @param array<int, array<string, mixed>> $headers
     * @param array<int, array<string, mixed>> $params
     * @param array<string, mixed>|null $body
     */
    public function __construct(
        public string $collectionId,
        public string $name,
        public string $method = 'GET',
        public string $url = '',
        public array $headers = [],
        public array $params = [],
        public ?array $body = null,
    ) {
    }
}
