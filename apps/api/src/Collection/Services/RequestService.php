<?php

declare(strict_types=1);

namespace App\Collection\Services;

use App\Collection\DTOs\CreateRequestDto;
use App\Collection\DTOs\UpdateRequestDto;
use App\Collection\Models\Collection;
use App\Collection\Models\Request;
use App\User\Models\User;
use Doctrine\ORM\EntityManagerInterface;
use InvalidArgumentException;

final class RequestService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {
    }

    public function create(User $user, CreateRequestDto $dto): Request
    {
        $collection = $this->findCollectionByIdAndUser($dto->collectionId, $user);
        if ($collection === null) {
            throw new InvalidArgumentException('Collection not found');
        }

        $maxSort = $this->getMaxSortOrder($collection);
        $request = new Request($collection, $dto->name);
        $request->setMethod($dto->method);
        $request->setUrl($dto->url);
        $request->setHeaders($dto->headers);
        $request->setParams($dto->params);
        $request->setBody($dto->body);
        $request->setSortOrder($maxSort + 1);

        $this->em->persist($request);
        $this->em->flush();

        return $request;
    }

    public function update(string $id, User $user, UpdateRequestDto $dto): Request
    {
        $request = $this->findByIdAndUser($id, $user);
        if ($request === null) {
            throw new InvalidArgumentException('Request not found');
        }

        if ($dto->name !== null) {
            $request->setName($dto->name);
        }

        if ($dto->method !== null) {
            $request->setMethod($dto->method);
        }

        if ($dto->url !== null) {
            $request->setUrl($dto->url);
        }

        if ($dto->headers !== null) {
            $request->setHeaders($dto->headers);
        }

        if ($dto->params !== null) {
            $request->setParams($dto->params);
        }

        if ($dto->body !== null) {
            $request->setBody($dto->body);
        }

        if ($dto->sortOrder !== null) {
            $request->setSortOrder($dto->sortOrder);
        }

        if ($dto->collectionId !== null) {
            $newCollection = $this->findCollectionByIdAndUser($dto->collectionId, $user);
            if ($newCollection === null) {
                throw new InvalidArgumentException('Target collection not found');
            }
            $request->setCollection($newCollection);
        }

        $this->em->flush();

        return $request;
    }

    public function delete(string $id, User $user): void
    {
        $request = $this->findByIdAndUser($id, $user);
        if ($request === null) {
            throw new InvalidArgumentException('Request not found');
        }

        $request->softDelete();
        $this->em->flush();
    }

    public function restore(string $id, User $user): Request
    {
        $request = $this->findByIdAndUser($id, $user, true);
        if ($request === null) {
            throw new InvalidArgumentException('Request not found');
        }

        $request->restore();
        $this->em->flush();

        return $request;
    }

    public function findByIdAndUser(string $id, User $user, bool $includeDeleted = false): ?Request
    {
        $qb = $this->em->createQueryBuilder()
            ->select('r')
            ->from(Request::class, 'r')
            ->join('r.collection', 'c')
            ->where('r.id = :id')
            ->andWhere('c.user = :user')
            ->setParameter('id', $id)
            ->setParameter('user', $user);

        if (!$includeDeleted) {
            $qb->andWhere('r.deletedAt IS NULL');
        }

        return $qb->getQuery()->getOneOrNullResult();
    }

    /**
     * @return Request[]
     */
    public function getByCollection(string $collectionId, User $user): array
    {
        return $this->em->createQueryBuilder()
            ->select('r')
            ->from(Request::class, 'r')
            ->join('r.collection', 'c')
            ->where('r.collection = :collectionId')
            ->andWhere('c.user = :user')
            ->andWhere('r.deletedAt IS NULL')
            ->setParameter('collectionId', $collectionId)
            ->setParameter('user', $user)
            ->orderBy('r.sortOrder', 'ASC')
            ->getQuery()
            ->getResult();
    }

    private function findCollectionByIdAndUser(string $id, User $user): ?Collection
    {
        return $this->em->createQueryBuilder()
            ->select('c')
            ->from(Collection::class, 'c')
            ->where('c.id = :id')
            ->andWhere('c.user = :user')
            ->andWhere('c.deletedAt IS NULL')
            ->setParameter('id', $id)
            ->setParameter('user', $user)
            ->getQuery()
            ->getOneOrNullResult();
    }

    private function getMaxSortOrder(Collection $collection): int
    {
        $result = $this->em->createQueryBuilder()
            ->select('MAX(r.sortOrder)')
            ->from(Request::class, 'r')
            ->where('r.collection = :collection')
            ->setParameter('collection', $collection)
            ->getQuery()
            ->getSingleScalarResult();

        return $result !== null ? (int) $result : 0;
    }
}
