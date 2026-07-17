<?php

declare(strict_types=1);

namespace App\Collection\Routes;

use App\Collection\Controllers\CollectionController;
use App\Collection\Controllers\RequestController;
use App\User\Middleware\AuthMiddleware;
use Stout\Http\Router;

final class CollectionRoutes
{
    public static function register(Router $router, AuthMiddleware $authMiddleware): void
    {
        // Collection CRUD
        $router->get('/api/collections', [CollectionController::class, 'index'])->add($authMiddleware);
        $router->get('/api/collections/{id}', [CollectionController::class, 'show'])->add($authMiddleware);
        $router->post('/api/collections', [CollectionController::class, 'create'])->add($authMiddleware);
        $router->patch('/api/collections/{id}', [CollectionController::class, 'update'])->add($authMiddleware);
        $router->delete('/api/collections/{id}', [CollectionController::class, 'delete'])->add($authMiddleware);
        $router->post('/api/collections/{id}/restore', [CollectionController::class, 'restore'])->add($authMiddleware);

        // Nested request route (RequestController is in Collection domain)
        $router->get('/api/collections/{collectionId}/requests', [RequestController::class, 'index'])->add($authMiddleware);
    }
}
