<?php

declare(strict_types=1);

namespace App\Request\Routes;

use App\Collection\Controllers\RequestController;
use App\User\Middleware\AuthMiddleware;
use Stout\Http\Router;

final class RequestRoutes
{
    public static function register(Router $router, AuthMiddleware $authMiddleware): void
    {
        $router->post('/api/requests', [RequestController::class, 'create'])->add($authMiddleware);
        $router->get('/api/requests/{id}', [RequestController::class, 'show'])->add($authMiddleware);
        $router->patch('/api/requests/{id}', [RequestController::class, 'update'])->add($authMiddleware);
        $router->delete('/api/requests/{id}', [RequestController::class, 'delete'])->add($authMiddleware);
        $router->post('/api/requests/{id}/restore', [RequestController::class, 'restore'])->add($authMiddleware);
    }
}
