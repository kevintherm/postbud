<?php

declare(strict_types=1);

namespace App\Collection\Services;

use App\Collection\DTOs\CreateCollectionDto;
use App\Collection\DTOs\UpdateCollectionDto;
use App\Collection\Models\Collection;
use App\User\Models\User;
use Doctrine\ORM\EntityManagerInterface;
use InvalidArgumentException;

final class CollectionService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {
    }

    /**
     * @return Collection[]
     */
    public function getTree(User $user): array
    {
        // Get all non-deleted collections for user, ordered by sort_order
        $collections = $this->em->createQueryBuilder()
            ->select('c')
            ->from(Collection::class, 'c')
            ->where('c.user = :user')
            ->andWhere('c.deletedAt IS NULL')
            ->setParameter('user', $user)
            ->orderBy('c.sortOrder', 'ASC')
            ->addOrderBy('c.name', 'ASC')
            ->getQuery()
            ->getResult();

        return $this->buildTree($collections);
    }

    /**
     * @param Collection[] $collections
     * @return Collection[]
     */
    private function buildTree(array $collections): array
    {
        $map = [];
        $roots = [];

        // Index by id
        foreach ($collections as $col) {
            $map[$col->getId()] = $col;
        }

        // Build tree
        foreach ($collections as $col) {
            $parent = $col->getParent();
            if ($parent === null || !isset($map[$parent->getId()])) {
                $roots[] = $col;
            }
        }

        return $roots;
    }

    public function create(User $user, CreateCollectionDto $dto): Collection
    {
        $parent = null;
        if ($dto->parentId !== null) {
            $parent = $this->findByIdAndUser($dto->parentId, $user);
            if ($parent === null) {
                throw new InvalidArgumentException('Parent collection not found');
            }
        }

        $maxSort = $this->getMaxSortOrder($user, $parent);
        $collection = new Collection($user, $dto->name, $parent);
        $collection->setSortOrder($maxSort + 1);

        $this->em->persist($collection);
        $this->em->flush();

        return $collection;
    }

    public function update(string $id, User $user, UpdateCollectionDto $dto): Collection
    {
        $collection = $this->findByIdAndUser($id, $user);
        if ($collection === null) {
            throw new InvalidArgumentException('Collection not found');
        }

        if ($dto->name !== null) {
            $collection->setName($dto->name);
        }

        if ($dto->sortOrder !== null) {
            $collection->setSortOrder($dto->sortOrder);
        }

        if ($dto->parentId !== null) {
            if ($dto->parentId === $id) {
                throw new InvalidArgumentException('Collection cannot be its own parent');
            }
            $parent = $this->findByIdAndUser($dto->parentId, $user);
            if ($parent === null) {
                throw new InvalidArgumentException('Parent collection not found');
            }
            $collection->setParent($parent);
        }

        $this->em->flush();

        return $collection;
    }

    public function delete(string $id, User $user): void
    {
        $collection = $this->findByIdAndUser($id, $user);
        if ($collection === null) {
            throw new InvalidArgumentException('Collection not found');
        }

        // Soft delete cascades to children via application logic
        $this->cascadeSoftDelete($collection);
        $this->em->flush();
    }

    public function restore(string $id, User $user): Collection
    {
        $collection = $this->findByIdAndUser($id, $user, true);
        if ($collection === null) {
            throw new InvalidArgumentException('Collection not found');
        }

        $collection->restore();
        $this->cascadeRestore($collection);
        $this->em->flush();

        return $collection;
    }

    public function findByIdAndUser(string $id, User $user, bool $includeDeleted = false): ?Collection
    {
        $qb = $this->em->createQueryBuilder()
            ->select('c')
            ->from(Collection::class, 'c')
            ->where('c.id = :id')
            ->andWhere('c.user = :user')
            ->setParameter('id', $id)
            ->setParameter('user', $user);

        if (!$includeDeleted) {
            $qb->andWhere('c.deletedAt IS NULL');
        }

        return $qb->getQuery()->getOneOrNullResult();
    }

    /**
     * @return Collection[]
     */
    public function getChildren(string $parentId, User $user): array
    {
        return $this->em->createQueryBuilder()
            ->select('c')
            ->from(Collection::class, 'c')
            ->where('c.parent = :parentId')
            ->andWhere('c.user = :user')
            ->andWhere('c.deletedAt IS NULL')
            ->setParameter('parentId', $parentId)
            ->setParameter('user', $user)
            ->orderBy('c.sortOrder', 'ASC')
            ->getQuery()
            ->getResult();
    }

    private function getMaxSortOrder(User $user, ?Collection $parent): int
    {
        $qb = $this->em->createQueryBuilder()
            ->select('MAX(c.sortOrder)')
            ->from(Collection::class, 'c')
            ->where('c.user = :user')
            ->setParameter('user', $user);

        if ($parent !== null) {
            $qb->andWhere('c.parent = :parent')->setParameter('parent', $parent);
        } else {
            $qb->andWhere('c.parent IS NULL');
        }

        $result = $qb->getQuery()->getSingleScalarResult();
        return $result !== null ? (int) $result : 0;
    }

    private function cascadeSoftDelete(Collection $collection): void
    {
        $collection->softDelete();

        // Soft delete children
        foreach ($collection->getChildren() as $child) {
            $this->cascadeSoftDelete($child);
        }

        // Soft delete requests
        foreach ($collection->getRequests() as $request) {
            $request->softDelete();
        }
    }

    private function cascadeRestore(Collection $collection): void
    {
        $collection->restore();

        // Restore children
        foreach ($collection->getChildren() as $child) {
            $this->cascadeRestore($child);
        }

        // Restore requests
        foreach ($collection->getRequests() as $request) {
            $request->restore();
        }
    }
}
