<?php

declare(strict_types=1);

namespace App\Collections\Controllers;

use App\Collections\Models\Collection;
use App\Collections\Models\RequestTemplate;
use App\User\Models\User;
use Doctrine\ORM\EntityManagerInterface;
use Stout\Http\Request;
use Stout\Http\Response;

class CollectionController
{
    public function __construct(private readonly EntityManagerInterface $entityManager)
    {
    }

    public function list(Request $request, Response $response): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('user');

        $collections = $this->entityManager->getRepository(Collection::class)
            ->findBy(['user' => $user]);

        $data = [];
        foreach ($collections as $col) {
            $requests = [];
            foreach ($col->getRequests() as $req) {
                $requests[] = [
                    'id' => $req->getId(),
                    'name' => $req->getName(),
                    'method' => $req->getMethod(),
                    'url' => $req->getUrl(),
                    'headers' => $req->getHeaders(),
                    'params' => $req->getParams(),
                    'body' => $req->getBody(),
                ];
            }
            $data[] = [
                'id' => $col->getId(),
                'name' => $col->getName(),
                'requests' => $requests,
            ];
        }

        return $response->json($data);
    }

    public function createCollection(Request $request, Response $response): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('user');
        $id = $request->json('id', '');
        $name = $request->json('name', '');

        if (empty($id) || empty($name)) {
            return $response->json(['error' => 'id and name are required'], 400);
        }

        $collection = new Collection();
        $collection->setId($id);
        $collection->setName($name);
        $collection->setUser($user);

        try {
            $this->entityManager->persist($collection);
            $this->entityManager->flush();
        } catch (\Doctrine\DBAL\Exception\UniqueConstraintViolationException $e) {
            return $response->json(['error' => 'Collection already exists'], 409);
        }

        return $response->json([
            'id' => $collection->getId(),
            'name' => $collection->getName(),
            'requests' => [],
        ], 201);
    }

    public function deleteCollection(Request $request, Response $response): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('user');
        $id = $request->getAttribute('id', '');

        $collection = $this->entityManager->getRepository(Collection::class)
            ->findOneBy(['id' => $id, 'user' => $user]);

        if ($collection === null) {
            return $response->json(['error' => 'Collection not found'], 404);
        }

        $this->entityManager->remove($collection);
        $this->entityManager->flush();

        return $response->json(['status' => 'success']);
    }

    public function addRequest(Request $request, Response $response): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('user');
        $collectionId = $request->getAttribute('id', '');

        $collection = $this->entityManager->getRepository(Collection::class)
            ->findOneBy(['id' => $collectionId, 'user' => $user]);

        if ($collection === null) {
            return $response->json(['error' => 'Collection not found'], 404);
        }

        $id = $request->json('id', '');
        $name = $request->json('name', '');
        $method = $request->json('method', 'GET');
        $url = $request->json('url', '');
        $headers = $request->json('headers', []);
        $params = $request->json('params', []);
        $body = $request->json('body', '');

        if (empty($id) || empty($name)) {
            return $response->json(['error' => 'id and name are required'], 400);
        }

        $template = new RequestTemplate();
        $template->setId($id);
        $template->setCollection($collection);
        $template->setName($name);
        $template->setMethod($method);
        $template->setUrl($url);
        $template->setHeaders($headers);
        $template->setParams($params);
        $template->setBody($body);

        try {
            $this->entityManager->persist($template);
            $this->entityManager->flush();
        } catch (\Doctrine\DBAL\Exception\UniqueConstraintViolationException $e) {
            return $response->json(['error' => 'Request template already exists'], 409);
        }

        return $response->json([
            'id' => $template->getId(),
            'name' => $template->getName(),
            'method' => $template->getMethod(),
            'url' => $template->getUrl(),
            'headers' => $template->getHeaders(),
            'params' => $template->getParams(),
            'body' => $template->getBody(),
        ], 201);
    }

    public function updateRequest(Request $request, Response $response): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('user');
        $collectionId = $request->getAttribute('collectionId', '');
        $requestId = $request->getAttribute('requestId', '');

        $collection = $this->entityManager->getRepository(Collection::class)
            ->findOneBy(['id' => $collectionId, 'user' => $user]);

        if ($collection === null) {
            return $response->json(['error' => 'Collection not found'], 404);
        }

        $template = $this->entityManager->getRepository(RequestTemplate::class)
            ->findOneBy(['id' => $requestId, 'collection' => $collection]);

        if ($template === null) {
            return $response->json(['error' => 'Request not found'], 404);
        }

        $name = $request->json('name', $template->getName());
        $method = $request->json('method', $template->getMethod());
        $url = $request->json('url', $template->getUrl());
        $headers = $request->json('headers', $template->getHeaders());
        $params = $request->json('params', $template->getParams());
        $body = $request->json('body', $template->getBody());

        $template->setName($name);
        $template->setMethod($method);
        $template->setUrl($url);
        $template->setHeaders($headers);
        $template->setParams($params);
        $template->setBody($body);

        $this->entityManager->flush();

        return $response->json([
            'id' => $template->getId(),
            'name' => $template->getName(),
            'method' => $template->getMethod(),
            'url' => $template->getUrl(),
            'headers' => $template->getHeaders(),
            'params' => $template->getParams(),
            'body' => $template->getBody(),
        ]);
    }

    public function deleteRequest(Request $request, Response $response): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('user');
        $collectionId = $request->getAttribute('collectionId', '');
        $requestId = $request->getAttribute('requestId', '');

        $collection = $this->entityManager->getRepository(Collection::class)
            ->findOneBy(['id' => $collectionId, 'user' => $user]);

        if ($collection === null) {
            return $response->json(['error' => 'Collection not found'], 404);
        }

        $template = $this->entityManager->getRepository(RequestTemplate::class)
            ->findOneBy(['id' => $requestId, 'collection' => $collection]);

        if ($template === null) {
            return $response->json(['error' => 'Request not found'], 404);
        }

        $this->entityManager->remove($template);
        $this->entityManager->flush();

        return $response->json(['status' => 'success']);
    }
}
