<?php

declare(strict_types=1);

namespace App\RequestHistory\DTOs;

final readonly class CreateHistoryDto
{
    /**
     * @param array<int, array<string, mixed>> $requestHeaders
     * @param array<int, array<string, mixed>> $requestParams
     * @param array<string, mixed>|null $requestBody
     * @param array<int, array<string, mixed>> $responseHeaders
     */
    public function __construct(
        public ?string $requestId = null,
        public string $method = 'GET',
        public string $url = '',
        public array $requestHeaders = [],
        public array $requestParams = [],
        public ?array $requestBody = null,
        public ?int $statusCode = null,
        public array $responseHeaders = [],
        public ?string $responseBody = null,
        public ?int $timingMs = null,
        public ?int $responseSize = null,
    ) {
    }
}
