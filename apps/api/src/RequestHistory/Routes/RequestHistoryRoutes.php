<?php

declare(strict_types=1);

namespace App\RequestHistory\Routes;

use App\RequestHistory\Controllers\RequestHistoryController;
use App\User\Middleware\AuthMiddleware;
use Stout\Http\Router;

final class RequestHistoryRoutes
{
    public static function register(Router $router, AuthMiddleware $authMiddleware): void
    {
        $router->get('/api/history', [RequestHistoryController::class, 'index'])->add($authMiddleware);
        $router->post('/api/history', [RequestHistoryController::class, 'create'])->add($authMiddleware);
        $router->get('/api/history/{id}', [RequestHistoryController::class, 'show'])->add($authMiddleware);
        $router->delete('/api/history/{id}', [RequestHistoryController::class, 'delete'])->add($authMiddleware);
        $router->delete('/api/history', [RequestHistoryController::class, 'clear'])->add($authMiddleware);
    }
}
