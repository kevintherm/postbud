<?php

declare(strict_types=1);

namespace App\RequestHistory\Services;

use App\Collection\Models\Request;
use App\RequestHistory\DTOs\CreateHistoryDto;
use App\RequestHistory\Models\RequestHistory;
use App\User\Models\User;
use Doctrine\ORM\EntityManagerInterface;
use InvalidArgumentException;

final class RequestHistoryService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {
    }

    public function create(User $user, CreateHistoryDto $dto): RequestHistory
    {
        $request = null;
        if ($dto->requestId !== null) {
            $request = $this->em->getRepository(Request::class)->find($dto->requestId);
            if ($request === null) {
                throw new InvalidArgumentException('Request not found');
            }
        }

        $history = new RequestHistory($user);
        $history->setRequest($request);
        $history->setMethod($dto->method);
        $history->setUrl($dto->url);
        $history->setRequestHeaders($dto->requestHeaders);
        $history->setRequestParams($dto->requestParams);
        $history->setRequestBody($dto->requestBody);
        $history->setStatusCode($dto->statusCode);
        $history->setResponseHeaders($dto->responseHeaders);
        $history->setResponseBody($dto->responseBody);
        $history->setTimingMs($dto->timingMs);
        $history->setResponseSize($dto->responseSize);

        $this->em->persist($history);
        $this->em->flush();

        return $history;
    }

    /**
     * @return RequestHistory[]
     */
    public function getForUser(User $user, int $limit = 100, int $offset = 0): array
    {
        return $this->em->createQueryBuilder()
            ->select('h')
            ->from(RequestHistory::class, 'h')
            ->where('h.user = :user')
            ->setParameter('user', $user)
            ->orderBy('h.executedAt', 'DESC')
            ->setMaxResults($limit)
            ->setFirstResult($offset)
            ->getQuery()
            ->getResult();
    }

    public function countForUser(User $user): int
    {
        return (int) $this->em->createQueryBuilder()
            ->select('COUNT(h.id)')
            ->from(RequestHistory::class, 'h')
            ->where('h.user = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function findByIdAndUser(string $id, User $user): ?RequestHistory
    {
        return $this->em->createQueryBuilder()
            ->select('h')
            ->from(RequestHistory::class, 'h')
            ->where('h.id = :id')
            ->andWhere('h.user = :user')
            ->setParameter('id', $id)
            ->setParameter('user', $user)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function delete(string $id, User $user): void
    {
        $history = $this->findByIdAndUser($id, $user);
        if ($history === null) {
            throw new InvalidArgumentException('History entry not found');
        }

        $this->em->remove($history);
        $this->em->flush();
    }

    public function clearAllForUser(User $user): int
    {
        $count = $this->countForUser($user);

        $this->em->createQueryBuilder()
            ->delete(RequestHistory::class, 'h')
            ->where('h.user = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->execute();

        return $count;
    }
}
