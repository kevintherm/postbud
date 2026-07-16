<?php

declare(strict_types=1);

namespace App\User\Models;

use DateTime;
use DateTimeInterface;
use Doctrine\ORM\Mapping as ORM;
use JsonSerializable;
use Override;

#[ORM\Entity]
#[ORM\Table(name: 'users')]
class User implements JsonSerializable
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private int $id = 0;

    #[ORM\Column(type: 'string', length: 255)]
    private string $name;

    #[ORM\Column(type: 'string', length: 255, unique: true)]
    private string $email;

    #[ORM\Column(type: 'string', length: 255)]
    private string $password;

    #[ORM\Column(type: 'string', length: 50)]
    private string $role = 'user';

    #[ORM\Column(name: 'sync_enabled', type: 'boolean')]
    private bool $syncEnabled = true;

    #[ORM\Column(name: 'created_at', type: 'datetime')]
    private DateTime $createdAt;

    public function __construct(
        string $name,
        string $email,
        #[\SensitiveParameter]
        string $password,
        string $role = 'user',
    ) {
        $this->name = $name;
        $this->email = $email;
        $this->password = $password;
        $this->role = $role;
        $this->syncEnabled = true;
        $this->createdAt = new DateTime();
    }

    /** @psalm-suppress PossiblyUnusedMethod */
    public function getId(): int
    {
        return $this->id;
    }

    /** @psalm-suppress PossiblyUnusedMethod */
    public function getName(): string
    {
        return $this->name;
    }

    /** @psalm-suppress PossiblyUnusedMethod */
    public function getEmail(): string
    {
        return $this->email;
    }

    public function getPassword(): string
    {
        return $this->password;
    }

    /** @psalm-suppress PossiblyUnusedMethod */
    public function getRole(): string
    {
        return $this->role;
    }

    /** @psalm-suppress PossiblyUnusedMethod */
    public function isSyncEnabled(): bool
    {
        return $this->syncEnabled;
    }

    /** @psalm-suppress PossiblyUnusedMethod */
    public function getCreatedAt(): \DateTimeInterface
    {
        return $this->createdAt;
    }

    public function setName(string $name): void
    {
        $this->name = $name;
    }

    public function setEmail(string $email): void
    {
        $this->email = $email;
    }

    public function setSyncEnabled(bool $syncEnabled): void
    {
        $this->syncEnabled = $syncEnabled;
    }

    /**
     * @return array<string, mixed>
     */
    #[Override]
    public function jsonSerialize(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'sync_enabled' => $this->syncEnabled,
            'created_at' => $this->createdAt->format(DateTimeInterface::ATOM),
        ];
    }
}
