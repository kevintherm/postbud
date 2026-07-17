<?php

declare(strict_types=1);

namespace App\Collection\Controllers;

use App\Collection\DTOs\CreateCollectionDto;
use App\Collection\DTOs\UpdateCollectionDto;
use App\Collection\Services\CollectionService;
use App\User\Models\User;
use InvalidArgumentException;
use OpenApi\Attributes as OA;
use Stout\Http\Request;
use Stout\Http\Response;

#[OA\Tag(name: 'Collections', description: 'Collection/folder management')]
final class CollectionController
{
    public function __construct(
        private readonly CollectionService $collectionService,
    ) {
    }

    #[OA\Get(path: '/api/collections', summary: 'Get collection tree', tags: ['Collections'])]
    public function index(Request $request, Response $response): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('auth_user');

        $tree = $this->collectionService->getTree($user);

        return $response->json([
            'collections' => array_map(
                static fn ($col) => $col->jsonSerialize(),
                $tree
            ),
        ]);
    }
    
    /**
     * @param array<int,mixed> $vars
     */
    #[OA\Get(path: '/api/collections/{id}', summary: 'Get collection by id', tags: ['Collections'])]
    public function show(Request $request, Response $response, array $vars): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('auth_user');
        $id = $vars['id'];

        $collection = $this->collectionService->findByIdAndUser($id, $user);
        if ($collection === null) {
            return $response->json(['error' => 'Not found'], 404);
        }

        return $response->json($collection);
    }

    #[OA\Post(path: '/api/collections', summary: 'Create collection', tags: ['Collections'])]
    public function create(Request $request, Response $response): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('auth_user');

        try {
            $dto = new CreateCollectionDto(
                name: (string) ($request->json('name') ?? ''),
                parentId: $request->json('parent_id'),
            );

            if ($dto->name === '') {
                throw new InvalidArgumentException('Name is required');
            }

            $collection = $this->collectionService->create($user, $dto);

            return $response->json(['status' => 'created', 'collection' => $collection], 201);
        } catch (InvalidArgumentException $e) {
            return $response->json(['error' => 'Validation failed', 'message' => $e->getMessage()], 422);
        }
    }
    
    /**
     * @param array<int,mixed> $vars
     */
    #[OA\Patch(path: '/api/collections/{id}', summary: 'Update collection', tags: ['Collections'])]
    public function update(Request $request, Response $response, array $vars): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('auth_user');
        $id = $vars['id'];

        try {
            $dto = new UpdateCollectionDto(
                name: $request->json('name'),
                parentId: $request->json('parent_id'),
                sortOrder: $request->json('sort_order') !== null
                    ? (int) $request->json('sort_order')
                    : null,
            );

            $collection = $this->collectionService->update($id, $user, $dto);

            return $response->json(['status' => 'updated', 'collection' => $collection]);
        } catch (InvalidArgumentException $e) {
            return $response->json(['error' => 'Validation failed', 'message' => $e->getMessage()], 422);
        }
    }
    
    /**
     * @param array<int,mixed> $vars
     */
    #[OA\Delete(path: '/api/collections/{id}', summary: 'Delete collection (soft)', tags: ['Collections'])]
    public function delete(Request $request, Response $response, array $vars): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('auth_user');
        $id = $vars['id'];

        try {
            $this->collectionService->delete($id, $user);

            return $response->json(['status' => 'deleted']);
        } catch (InvalidArgumentException $e) {
            return $response->json(['error' => 'Not found', 'message' => $e->getMessage()], 404);
        }
    }
    
    /**
     * @param array<int,mixed> $vars
     */
    #[OA\Post(path: '/api/collections/{id}/restore', summary: 'Restore deleted collection', tags: ['Collections'])]
    public function restore(Request $request, Response $response, array $vars): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('auth_user');
        $id = $vars['id'];

        try {
            $collection = $this->collectionService->restore($id, $user);

            return $response->json(['status' => 'restored', 'collection' => $collection]);
        } catch (InvalidArgumentException $e) {
            return $response->json(['error' => 'Not found', 'message' => $e->getMessage()], 404);
        }
    }
}
