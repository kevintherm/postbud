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
                collectionId: (string) ($request->json('collection_id') ?? ''),
                name: (string) ($request->json('name') ?? ''),
                method: (string) ($request->json('method') ?? 'GET'),
                url: (string) ($request->json('url') ?? ''),
                headers: $headers,
                params: $params,
                body: $body,
            );

            if ($dto->collectionId === '') {
                throw new InvalidArgumentException('collection_id is required');
            }
            if ($dto->name === '') {
                throw new InvalidArgumentException('name is required');
            }

            $req = $this->requestService->create($user, $dto);

            return $response->json(['status' => 'created', 'request' => $req], 201);
        } catch (InvalidArgumentException $e) {
            return $response->json(['error' => 'Validation failed', 'message' => $e->getMessage()], 422);
        }
    }

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

    #[OA\Patch(path: '/api/requests/{id}', summary: 'Update request', tags: ['Requests'])]
    public function update(Request $request, Response $response, array $vars): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('auth_user');
        $id = $vars['id'];

        try {
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
                collectionId: $request->json('collection_id'),
            );

            $req = $this->requestService->update($id, $user, $dto);

            return $response->json(['status' => 'updated', 'request' => $req]);
        } catch (InvalidArgumentException $e) {
            return $response->json(['error' => 'Validation failed', 'message' => $e->getMessage()], 422);
        }
    }

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
