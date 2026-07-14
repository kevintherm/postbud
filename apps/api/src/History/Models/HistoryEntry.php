<?php

declare(strict_types=1);

namespace App\History\Models;

use App\User\Models\User;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'history_entries')]
class HistoryEntry
{
    #[ORM\Id]
    #[ORM\Column(type: 'string')]
    private string $id;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    private User $user;

    #[ORM\Column(type: 'string')]
    private string $url;

    #[ORM\Column(type: 'string')]
    private string $method;

    #[ORM\Column(type: 'integer')]
    private int $status;

    #[ORM\Column(type: 'integer')]
    private int $time;

    #[ORM\Column(type: 'integer')]
    private int $size;

    #[ORM\Column(type: 'integer')]
    private int $timestamp;

    public function getId(): string
    {
        return $this->id;
    }

    public function setId(string $id): void
    {
        $this->id = $id;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function setUser(User $user): void
    {
        $this->user = $user;
    }

    public function getUrl(): string
    {
        return $this->url;
    }

    public function setUrl(string $url): void
    {
        $this->url = $url;
    }

    public function getMethod(): string
    {
        return $this->method;
    }

    public function setMethod(string $method): void
    {
        $this->method = $method;
    }

    public function getStatus(): int
    {
        return $this->status;
    }

    public function setStatus(int $status): void
    {
        $this->status = $status;
    }

    public function getTime(): int
    {
        return $this->time;
    }

    public function setTime(int $time): void
    {
        $this->time = $time;
    }

    public function getSize(): int
    {
        return $this->size;
    }

    public function setSize(int $size): void
    {
        $this->size = $size;
    }

    public function getTimestamp(): int
    {
        return $this->timestamp;
    }

    public function setTimestamp(int $timestamp): void
    {
        $this->timestamp = $timestamp;
    }
}
