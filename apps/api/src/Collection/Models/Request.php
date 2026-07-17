<?php

declare(strict_types=1);

namespace App\Collection\Models;

use App\User\Models\User;
use DateTime;
use DateTimeInterface;
use Doctrine\ORM\Mapping as ORM;
use JsonSerializable;
use Ramsey\Uuid\Uuid;

#[ORM\Entity]
#[ORM\Table(name: 'requests')]
#[ORM\Index(columns: ['collection_id'], name: 'idx_request_collection')]
class Request implements JsonSerializable
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    private string $id;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false)]
    private User $user;

    #[ORM\ManyToOne(targetEntity: Collection::class, inversedBy: 'requests')]
    #[ORM\JoinColumn(name: 'collection_id', referencedColumnName: 'id', nullable: true)]
    private ?Collection $collection = null;

    #[ORM\Column(type: 'string', length: 255)]
    private string $name;

    #[ORM\Column(type: 'string', length: 10)]
    private string $method = 'GET';

    #[ORM\Column(type: 'string', length: 2048)]
    private string $url = '';

    /** @var array<int, array<string, mixed>> */
    #[ORM\Column(type: 'json')]
    private array $headers = [];

    /** @var array<int, array<string, mixed>> */
    #[ORM\Column(type: 'json')]
    private array $params = [];

    /** @var array<string, mixed>|null */
    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $body = null;

    #[ORM\Column(name: 'sort_order', type: 'integer')]
    private int $sortOrder = 0;

    #[ORM\Column(name: 'created_at', type: 'datetime')]
    private DateTime $createdAt;

    #[ORM\Column(name: 'updated_at', type: 'datetime')]
    private DateTime $updatedAt;

    #[ORM\Column(name: 'deleted_at', type: 'datetime', nullable: true)]
    private ?DateTime $deletedAt = null;

    public function __construct(User $user, string $name, ?Collection $collection = null)
    {
        $this->id = Uuid::uuid7()->toString();
        $this->user = $user;
        $this->collection = $collection;
        $this->name = $name;
        $this->createdAt = new DateTime();
        $this->updatedAt = new DateTime();
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function getCollection(): ?Collection
    {
        return $this->collection;
    }

    public function setCollection(?Collection $collection): void
    {
        $this->collection = $collection;
        $this->updatedAt = new DateTime();
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): void
    {
        $this->name = $name;
        $this->updatedAt = new DateTime();
    }

    public function getMethod(): string
    {
        return $this->method;
    }

    public function setMethod(string $method): void
    {
        $this->method = strtoupper($method);
        $this->updatedAt = new DateTime();
    }

    public function getUrl(): string
    {
        return $this->url;
    }

    public function setUrl(string $url): void
    {
        $this->url = $url;
        $this->updatedAt = new DateTime();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getHeaders(): array
    {
        return $this->headers;
    }

    /**
     * @param array<int, array<string, mixed>> $headers
     */
    public function setHeaders(array $headers): void
    {
        $this->headers = $headers;
        $this->updatedAt = new DateTime();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getParams(): array
    {
        return $this->params;
    }

    /**
     * @param array<int, array<string, mixed>> $params
     */
    public function setParams(array $params): void
    {
        $this->params = $params;
        $this->updatedAt = new DateTime();
    }

    /**
     * @return array<string, mixed>|null
     */
    public function getBody(): ?array
    {
        return $this->body;
    }

    /**
     * @param array<string, mixed>|null $body
     */
    public function setBody(?array $body): void
    {
        $this->body = $body;
        $this->updatedAt = new DateTime();
    }

    public function getSortOrder(): int
    {
        return $this->sortOrder;
    }

    public function setSortOrder(int $sortOrder): void
    {
        $this->sortOrder = $sortOrder;
        $this->updatedAt = new DateTime();
    }

    public function getCreatedAt(): DateTimeInterface
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): DateTimeInterface
    {
        return $this->updatedAt;
    }

    public function getDeletedAt(): ?DateTimeInterface
    {
        return $this->deletedAt;
    }

    public function isDeleted(): bool
    {
        return $this->deletedAt !== null;
    }

    public function softDelete(): void
    {
        $this->deletedAt = new DateTime();
    }

    public function restore(): void
    {
        $this->deletedAt = null;
    }

    public function jsonSerialize(): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user->getId(),
            'collection_id' => $this->collection?->getId(),
            'name' => $this->name,
            'method' => $this->method,
            'url' => $this->url,
            'headers' => $this->headers,
            'params' => $this->params,
            'body' => $this->body,
            'sort_order' => $this->sortOrder,
            'created_at' => $this->createdAt->format(DateTimeInterface::ATOM),
            'updated_at' => $this->updatedAt->format(DateTimeInterface::ATOM),
            'deleted_at' => $this->deletedAt?->format(DateTimeInterface::ATOM),
        ];
    }
}
