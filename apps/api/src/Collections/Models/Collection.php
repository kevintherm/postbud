<?php

declare(strict_types=1);

namespace App\Collections\Models;

use App\User\Models\User;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection as DoctrineCollection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'collections')]
class Collection
{
    #[ORM\Id]
    #[ORM\Column(type: 'string')]
    private string $id;

    #[ORM\Column(type: 'string')]
    private string $name;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    private User $user;

    #[ORM\OneToMany(mappedBy: 'collection', targetEntity: RequestTemplate::class, cascade: ['all'], orphanRemoval: true)]
    private DoctrineCollection $requests;

    public function __construct()
    {
        $this->requests = new ArrayCollection();
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function setId(string $id): void
    {
        $this->id = $id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): void
    {
        $this->name = $name;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function setUser(User $user): void
    {
        $this->user = $user;
    }

    /**
     * @return DoctrineCollection<int, RequestTemplate>
     */
    public function getRequests(): DoctrineCollection
    {
        return $this->requests;
    }
}
