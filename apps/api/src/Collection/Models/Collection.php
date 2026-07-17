<?php

declare(strict_types=1);

namespace App\Collection\Models;

use App\User\Models\User;
use DateTime;
use DateTimeInterface;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\ORM\Mapping as ORM;
use JsonSerializable;
use Override;
use Ramsey\Uuid\Uuid;

#[ORM\Entity]
#[ORM\Table(name: 'collections')]
#[ORM\Index(columns: ['user_id'], name: 'idx_collection_user')]
#[ORM\Index(columns: ['parent_id'], name: 'idx_collection_parent')]
class Collection implements JsonSerializable
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    private string $id;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false)]
    private User $user;

    #[ORM\ManyToOne(targetEntity: self::class, inversedBy: 'children')]
    #[ORM\JoinColumn(name: 'parent_id', referencedColumnName: 'id', nullable: true)]
    private ?Collection $parent = null;

    #[ORM\OneToMany(targetEntity: self::class, mappedBy: 'parent')]
    private iterable $children;

    #[ORM\OneToMany(targetEntity: Request::class, mappedBy: 'collection')]
    private iterable $requests;

    #[ORM\Column(type: 'string', length: 255)]
    private string $name;

    #[ORM\Column(name: 'sort_order', type: 'integer')]
    private int $sortOrder = 0;

    #[ORM\Column(name: 'created_at', type: 'datetime')]
    private DateTime $createdAt;

    #[ORM\Column(name: 'updated_at', type: 'datetime')]
    private DateTime $updatedAt;

    #[ORM\Column(name: 'deleted_at', type: 'datetime', nullable: true)]
    private ?DateTime $deletedAt = null;

    public function __construct(User $user, string $name, ?Collection $parent = null)
    {
        $this->id = Uuid::uuid4()->toString();
        $this->user = $user;
        $this->parent = $parent;
        $this->name = $name;
        $this->children = new ArrayCollection();
        $this->requests = new ArrayCollection();
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

    public function getParent(): ?Collection
    {
        return $this->parent;
    }

    public function setParent(?Collection $parent): void
    {
        $this->parent = $parent;
        $this->updatedAt = new DateTime();
    }

    public function getChildren(): iterable
    {
        return $this->children;
    }

    public function getRequests(): iterable
    {
        return $this->requests;
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

    #[Override]
    public function jsonSerialize(): array
    {
        $activeChildren = [];
        if ($this->children !== null) {
            foreach ($this->children as $child) {
                if (!$child->isDeleted()) {
                    $activeChildren[] = $child->jsonSerialize();
                }
            }
        }

        $activeRequests = [];
        if ($this->requests !== null) {
            foreach ($this->requests as $req) {
                if (!$req->isDeleted()) {
                    $activeRequests[] = $req->jsonSerialize();
                }
            }
        }

        usort($activeChildren, fn ($a, $b) => $a['sort_order'] <=> $b['sort_order']);
        usort($activeRequests, fn ($a, $b) => $a['sort_order'] <=> $b['sort_order']);

        return [
            'id' => $this->id,
            'user_id' => $this->user->getId(),
            'parent_id' => $this->parent?->getId(),
            'name' => $this->name,
            'sort_order' => $this->sortOrder,
            'children' => $activeChildren,
            'requests' => $activeRequests,
            'created_at' => $this->createdAt->format(DateTimeInterface::ATOM),
            'updated_at' => $this->updatedAt->format(DateTimeInterface::ATOM),
            'deleted_at' => $this->deletedAt?->format(DateTimeInterface::ATOM),
        ];
    }
}
