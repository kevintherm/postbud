<?php

declare(strict_types=1);

namespace App\User\Routes;

use App\User\Controllers\UserController;
use App\User\Middleware\AuthMiddleware;
use Stout\Http\Router;

final class UserRoutes
{
    public static function register(Router $router, AuthMiddleware $authMiddleware): void
    {
        $router->get('/api/me', [UserController::class, 'me'])->add($authMiddleware);
        $router->get('/api/users', [UserController::class, 'index'])->add($authMiddleware);
        $router->put('/api/users/{id:\d+}', [UserController::class, 'update'])->add($authMiddleware);
    }
}
