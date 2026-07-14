<?php

declare(strict_types=1);

namespace App\History\Controllers;

use App\History\Models\HistoryEntry;
use App\User\Models\User;
use Doctrine\ORM\EntityManagerInterface;
use Stout\Http\Request;
use Stout\Http\Response;

class HistoryController
{
    public function __construct(private readonly EntityManagerInterface $entityManager)
    {
    }

    public function list(Request $request, Response $response): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('user');

        $entries = $this->entityManager->getRepository(HistoryEntry::class)
            ->findBy(['user' => $user], ['timestamp' => 'DESC']);

        $data = [];
        foreach ($entries as $entry) {
            $data[] = [
                'id' => $entry->getId(),
                'url' => $entry->getUrl(),
                'method' => $entry->getMethod(),
                'status' => $entry->getStatus(),
                'time' => $entry->getTime(),
                'size' => $entry->getSize(),
                'timestamp' => $entry->getTimestamp(),
            ];
        }

        return $response->json($data);
    }

    public function create(Request $request, Response $response): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('user');
        $id = $request->json('id', '');
        $url = $request->json('url', '');
        $method = $request->json('method', 'GET');
        $status = (int)$request->json('status', 200);
        $time = (int)$request->json('time', 0);
        $size = (int)$request->json('size', 0);
        $timestamp = (int)$request->json('timestamp', time());

        if (empty($id) || empty($url)) {
            return $response->json(['error' => 'id and url are required'], 400);
        }

        $entry = new HistoryEntry();
        $entry->setId($id);
        $entry->setUrl($url);
        $entry->setMethod($method);
        $entry->setStatus($status);
        $entry->setTime($time);
        $entry->setSize($size);
        $entry->setTimestamp($timestamp);
        $entry->setUser($user);

        $this->entityManager->persist($entry);
        $this->entityManager->flush();

        return $response->json([
            'id' => $entry->getId(),
            'url' => $entry->getUrl(),
            'method' => $entry->getMethod(),
            'status' => $entry->getStatus(),
            'time' => $entry->getTime(),
            'size' => $entry->getSize(),
            'timestamp' => $entry->getTimestamp(),
        ], 201);
    }

    public function delete(Request $request, Response $response): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('user');
        $id = $request->getAttribute('id', '');

        $entry = $this->entityManager->getRepository(HistoryEntry::class)
            ->findOneBy(['id' => $id, 'user' => $user]);

        if ($entry === null) {
            return $response->json(['error' => 'History entry not found'], 404);
        }

        $this->entityManager->remove($entry);
        $this->entityManager->flush();

        return $response->json(['status' => 'success']);
    }

    public function clear(Request $request, Response $response): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('user');

        $repo = $this->entityManager->getRepository(HistoryEntry::class);
        $entries = $repo->findBy(['user' => $user]);

        foreach ($entries as $entry) {
            $this->entityManager->remove($entry);
        }
        $this->entityManager->flush();

        return $response->json(['status' => 'success']);
    }
}
