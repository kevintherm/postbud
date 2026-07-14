<?php

declare(strict_types=1);

namespace App\Collections\Models;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'request_templates')]
class RequestTemplate
{
    #[ORM\Id]
    #[ORM\Column(type: 'string')]
    private string $id;

    #[ORM\ManyToOne(targetEntity: Collection::class, inversedBy: 'requests')]
    #[ORM\JoinColumn(name: 'collection_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    private Collection $collection;

    #[ORM\Column(type: 'string')]
    private string $name;

    #[ORM\Column(type: 'string')]
    private string $method;

    #[ORM\Column(type: 'string')]
    private string $url;

    #[ORM\Column(type: 'json')]
    private array $headers = [];

    #[ORM\Column(type: 'json')]
    private array $params = [];

    #[ORM\Column(type: 'text')]
    private string $body = '';

    public function getId(): string
    {
        return $this->id;
    }

    public function setId(string $id): void
    {
        $this->id = $id;
    }

    public function getCollection(): Collection
    {
        return $this->collection;
    }

    public function setCollection(Collection $collection): void
    {
        $this->collection = $collection;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): void
    {
        $this->name = $name;
    }

    public function getMethod(): string
    {
        return $this->method;
    }

    public function setMethod(string $method): void
    {
        $this->method = $method;
    }

    public function getUrl(): string
    {
        return $this->url;
    }

    public function setUrl(string $url): void
    {
        $this->url = $url;
    }

    public function getHeaders(): array
    {
        return $this->headers;
    }

    public function setHeaders(array $headers): void
    {
        $this->headers = $headers;
    }

    public function getParams(): array
    {
        return $this->params;
    }

    public function setParams(array $params): void
    {
        $this->params = $params;
    }

    public function getBody(): string
    {
        return $this->body;
    }

    public function setBody(string $body): void
    {
        $this->body = $body;
    }
}
