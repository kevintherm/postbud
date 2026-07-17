<?php

declare(strict_types=1);

namespace App\Collection\Controllers;

use App\Collection\DTOs\CreateRequestDto;
use App\Collection\DTOs\UpdateRequestDto;
use App\Collection\Services\RequestService;
use App\User\Models\User;
use InvalidArgumentException;
use OpenApi\Attributes as OA;
use Stout\Http\Request;
use Stout\Http\Response;

#[OA\Tag(name: 'Requests', description: 'Request CRUD within collections')]
final class RequestController
{
    public function __construct(
        private readonly RequestService $requestService,
    ) {
    }

    /**
     * @param array<int,mixed> $vars
     */
    #[OA\Get(path: '/api/collections/{collectionId}/requests', summary: 'List requests in collection', tags: ['Requests'])]
    public function index(Request $request, Response $response, array $vars): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('auth_user');
        $collectionId = $vars['collectionId'];

        $requests = $this->requestService->getByCollection($collectionId, $user);

        return $response->json([
            'requests' => array_map(
                static fn ($req) => $req->jsonSerialize(),
                $requests
            ),
        ]);
    }

    #[OA\Get(path: '/api/requests', summary: 'List top-level requests', tags: ['Requests'])]
    public function topLevel(Request $request, Response $response): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('auth_user');

        $requests = $this->requestService->getTopLevelRequests($user);

        return $response->json([
            'requests' => array_map(
                static fn ($req) => $req->jsonSerialize(),
                $requests
            ),
        ]);
    }

    #[OA\Post(path: '/api/requests', summary: 'Create request', tags: ['Requests'])]
    public function create(Request $request, Response $response): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('auth_user');

        try {
            $headers = $request->json('headers') ?? [];
            $params = $request->json('params') ?? [];
            $body = $request->json('body');

            $dto = new CreateRequestDto(
                collectionId: $request->json('collection_id') !== null ? (string) $request->json('collection_id') : null,
                name: (string) ($request->json('name') ?? ''),
                method: (string) ($request->json('method') ?? 'GET'),
                url: (string) ($request->json('url') ?? ''),
                headers: $headers,
                params: $params,
                body: $body,
            );

            if ($dto->name === '') {
                throw new InvalidArgumentException('name is required');
            }

            $req = $this->requestService->create($user, $dto);

            return $response->json(['status' => 'created', 'request' => $req], 201);
        } catch (InvalidArgumentException $e) {
            return $response->json(['error' => 'Validation failed', 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * @param array<int,mixed> $vars
     */
    #[OA\Get(path: '/api/requests/{id}', summary: 'Get request by id', tags: ['Requests'])]
    public function show(Request $request, Response $response, array $vars): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('auth_user');
        $id = $vars['id'];

        $req = $this->requestService->findByIdAndUser($id, $user);
        if ($req === null) {
            return $response->json(['error' => 'Not found'], 404);
        }

        return $response->json($req);
    }

    /**
     * @param array<int,mixed> $vars
     */
    #[OA\Patch(path: '/api/requests/{id}', summary: 'Update request', tags: ['Requests'])]
    public function update(Request $request, Response $response, array $vars): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('auth_user');
        $id = $vars['id'];

        try {
            $json = $request->getParsedBody() ?? [];
            $collectionId = null;
            if (array_key_exists('collection_id', $json)) {
                $collectionId = $json['collection_id'] !== null ? (string) $json['collection_id'] : '';
            }

            $dto = new UpdateRequestDto(
                name: $request->json('name'),
                method: $request->json('method'),
                url: $request->json('url'),
                headers: $request->json('headers'),
                params: $request->json('params'),
                body: $request->json('body'),
                sortOrder: $request->json('sort_order') !== null
                    ? (int) $request->json('sort_order')
                    : null,
                collectionId: $collectionId,
            );

            $req = $this->requestService->update($id, $user, $dto);

            return $response->json(['status' => 'updated', 'request' => $req]);
        } catch (InvalidArgumentException $e) {
            return $response->json(['error' => 'Validation failed', 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * @param array<int,mixed> $vars
     */
    #[OA\Delete(path: '/api/requests/{id}', summary: 'Delete request (soft)', tags: ['Requests'])]
    public function delete(Request $request, Response $response, array $vars): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('auth_user');
        $id = $vars['id'];

        try {
            $this->requestService->delete($id, $user);

            return $response->json(['status' => 'deleted']);
        } catch (InvalidArgumentException $e) {
            return $response->json(['error' => 'Not found', 'message' => $e->getMessage()], 404);
        }
    }

    /**
     * @param array<int,mixed> $vars
     */
    #[OA\Post(path: '/api/requests/{id}/restore', summary: 'Restore deleted request', tags: ['Requests'])]
    public function restore(Request $request, Response $response, array $vars): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('auth_user');
        $id = $vars['id'];

        try {
            $req = $this->requestService->restore($id, $user);

            return $response->json(['status' => 'restored', 'request' => $req]);
        } catch (InvalidArgumentException $e) {
            return $response->json(['error' => 'Not found', 'message' => $e->getMessage()], 404);
        }
    }
}
