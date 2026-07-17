<?php

declare(strict_types=1);

namespace App\RequestHistory\Models;

use App\Collection\Models\Request;
use App\User\Models\User;
use DateTime;
use DateTimeInterface;
use Doctrine\ORM\Mapping as ORM;
use JsonSerializable;
use Override;
use Ramsey\Uuid\Uuid;

#[ORM\Entity]
#[ORM\Table(name: 'request_history')]
#[ORM\Index(columns: ['user_id'], name: 'idx_history_user')]
#[ORM\Index(columns: ['request_id'], name: 'idx_history_request')]
class RequestHistory implements JsonSerializable
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    private string $id;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false)]
    private User $user;

    #[ORM\ManyToOne(targetEntity: Request::class)]
    #[ORM\JoinColumn(name: 'request_id', referencedColumnName: 'id', nullable: true)]
    private ?Request $request = null;

    #[ORM\Column(type: 'string', length: 10)]
    private string $method = 'GET';

    #[ORM\Column(type: 'string', length: 2048)]
    private string $url = '';

    /** @var array<int, array<string, mixed>> */
    #[ORM\Column(name: 'request_headers', type: 'json')]
    private array $requestHeaders = [];

    /** @var array<int, array<string, mixed>> */
    #[ORM\Column(name: 'request_params', type: 'json')]
    private array $requestParams = [];

    /** @var mixed */
    #[ORM\Column(name: 'request_body', type: 'json', nullable: true)]
    private mixed $requestBody = null;

    #[ORM\Column(name: 'status_code', type: 'integer', nullable: true)]
    private ?int $statusCode = null;

    #[ORM\Column(name: 'response_headers', type: 'json')]
    private array $responseHeaders = [];

    #[ORM\Column(name: 'response_body', type: 'text', nullable: true)]
    private ?string $responseBody = null;

    #[ORM\Column(name: 'timing_ms', type: 'integer', nullable: true)]
    private ?int $timingMs = null;

    #[ORM\Column(name: 'response_size', type: 'integer', nullable: true)]
    private ?int $responseSize = null;

    #[ORM\Column(name: 'executed_at', type: 'datetime')]
    private DateTime $executedAt;

    public function __construct(User $user)
    {
        $this->id = Uuid::uuid7()->toString();
        $this->user = $user;
        $this->executedAt = new DateTime();
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function getRequest(): ?Request
    {
        return $this->request;
    }

    public function setRequest(?Request $request): void
    {
        $this->request = $request;
    }

    public function getMethod(): string
    {
        return $this->method;
    }

    public function setMethod(string $method): void
    {
        $this->method = strtoupper($method);
    }

    public function getUrl(): string
    {
        return $this->url;
    }

    public function setUrl(string $url): void
    {
        $this->url = $url;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getRequestHeaders(): array
    {
        return $this->requestHeaders;
    }

    /**
     * @param array<int, array<string, mixed>> $requestHeaders
     */
    public function setRequestHeaders(array $requestHeaders): void
    {
        $this->requestHeaders = $requestHeaders;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getRequestParams(): array
    {
        return $this->requestParams;
    }

    /**
     * @param array<int, array<string, mixed>> $requestParams
     */
    public function setRequestParams(array $requestParams): void
    {
        $this->requestParams = $requestParams;
    }

    /**
     * @return mixed
     */
    public function getRequestBody(): mixed
    {
        return $this->requestBody;
    }

    /**
     * @param mixed $requestBody
     */
    public function setRequestBody(mixed $requestBody): void
    {
        $this->requestBody = $requestBody;
    }

    public function getStatusCode(): ?int
    {
        return $this->statusCode;
    }

    public function setStatusCode(?int $statusCode): void
    {
        $this->statusCode = $statusCode;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getResponseHeaders(): array
    {
        return $this->responseHeaders;
    }

    /**
     * @param array<int, array<string, mixed>> $responseHeaders
     */
    public function setResponseHeaders(array $responseHeaders): void
    {
        $this->responseHeaders = $responseHeaders;
    }

    public function getResponseBody(): ?string
    {
        return $this->responseBody;
    }

    public function setResponseBody(?string $responseBody): void
    {
        $this->responseBody = $responseBody;
    }

    public function getTimingMs(): ?int
    {
        return $this->timingMs;
    }

    public function setTimingMs(?int $timingMs): void
    {
        $this->timingMs = $timingMs;
    }

    public function getResponseSize(): ?int
    {
        return $this->responseSize;
    }

    public function setResponseSize(?int $responseSize): void
    {
        $this->responseSize = $responseSize;
    }

    public function getExecutedAt(): DateTimeInterface
    {
        return $this->executedAt;
    }

    #[Override]
    public function jsonSerialize(): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user->getId(),
            'request_id' => $this->request?->getId(),
            'method' => $this->method,
            'url' => $this->url,
            'request_headers' => $this->requestHeaders,
            'request_params' => $this->requestParams,
            'request_body' => $this->requestBody,
            'status_code' => $this->statusCode,
            'response_headers' => $this->responseHeaders,
            'response_body' => $this->responseBody,
            'timing_ms' => $this->timingMs,
            'response_size' => $this->responseSize,
            'executed_at' => $this->executedAt->format(DateTimeInterface::ATOM),
        ];
    }
}
