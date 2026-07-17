<?php

declare(strict_types=1);

namespace App\RequestHistory\Controllers;

use App\RequestHistory\DTOs\CreateHistoryDto;
use App\RequestHistory\Services\RequestHistoryService;
use App\User\Models\User;
use InvalidArgumentException;
use OpenApi\Attributes as OA;
use Stout\Http\Request;
use Stout\Http\Response;

#[OA\Tag(name: 'RequestHistory', description: 'Request execution history')]
final class RequestHistoryController
{
    public function __construct(
        private readonly RequestHistoryService $historyService,
    ) {
    }

    #[OA\Get(path: '/api/history', summary: 'Get request history', tags: ['RequestHistory'])]
    public function index(Request $request, Response $response): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('auth_user');

        $limit = (int) ($request->query('limit') ?? 100);
        $offset = (int) ($request->query('offset') ?? 0);

        $limit = max(1, min(500, $limit));

        $history = $this->historyService->getForUser($user, $limit, $offset);
        $total = $this->historyService->countForUser($user);

        return $response->json([
            'history' => array_map(
                static fn ($h) => $h->jsonSerialize(),
                $history
            ),
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset,
        ]);
    }

    #[OA\Post(path: '/api/history', summary: 'Record request execution', tags: ['RequestHistory'])]
    public function create(Request $request, Response $response): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('auth_user');

        $dtoResult = $this->buildCreateDto($request);
        if ($dtoResult instanceof Response) {
            return $dtoResult;
        }

        $history = $this->historyService->create($user, $dtoResult);

        return $response->json(['status' => 'created', 'history' => $history], 201);
    }

    /**
     * @param array<int,mixed> $vars
     */
    #[OA\Get(path: '/api/history/{id}', summary: 'Get history entry by id', tags: ['RequestHistory'])]
    public function show(Request $request, Response $response, array $vars): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('auth_user');
        $id = $vars['id'];

        $history = $this->historyService->findByIdAndUser($id, $user);
        if ($history === null) {
            return $response->json(['error' => 'Not found'], 404);
        }

        return $response->json($history);
    }

    /**
     * @param array<int,mixed> $vars
     */
    #[OA\Delete(path: '/api/history/{id}', summary: 'Delete history entry', tags: ['RequestHistory'])]
    public function delete(Request $request, Response $response, array $vars): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('auth_user');
        $id = $vars['id'];

        try {
            $this->historyService->delete($id, $user);

            return $response->json(['status' => 'deleted']);
        } catch (InvalidArgumentException $e) {
            return $response->json(['error' => 'Not found', 'message' => $e->getMessage()], 404);
        }
    }

    #[OA\Delete(path: '/api/history', summary: 'Clear all history for user', tags: ['RequestHistory'])]
    public function clear(Request $request, Response $response): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('auth_user');

        $count = $this->historyService->clearAllForUser($user);

        return $response->json(['status' => 'cleared', 'deleted' => $count]);
    }

    private function buildCreateDto(Request $request): CreateHistoryDto|Response
    {
        $url = (string) ($request->json('url') ?? '');

        if ($url === '') {
            return $this->validationError('url is required');
        }

        $requestId = $request->json('request_id');
        if (is_string($requestId)) {
            $requestId = trim($requestId);
            if ($requestId === '' || !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $requestId)) {
                $requestId = null;
            }
        } else {
            $requestId = null;
        }

        try {
            return new CreateHistoryDto(
                requestId: $requestId,
                method: (string) ($request->json('method') ?? 'GET'),
                url: $url,
                requestHeaders: $request->json('request_headers') ?? [],
                requestParams: $request->json('request_params') ?? [],
                requestBody: $request->json('request_body'),
                statusCode: $request->json('status_code'),
                responseHeaders: $request->json('response_headers') ?? [],
                responseBody: is_string($request->json('response_body')) ? $request->json('response_body') : json_encode($request->json('response_body')),
                timingMs: $request->json('timing_ms'),
                responseSize: $request->json('response_size'),
            );
        } catch (InvalidArgumentException $e) {
            return $this->validationError($e->getMessage());
        }
    }

    private function validationError(string $message): Response
    {
        return (new Response())->json(['error' => 'Validation failed', 'message' => $message], 422);
    }
}
