<?php

declare(strict_types=1);

namespace App\Auth\Routes;

use App\User\Controllers\UserController;
use Stout\Http\Router;

final class AuthRoutes
{
    public static function register(Router $router): void
    {
        $router->post('/api/register', [UserController::class, 'register']);
        $router->post('/api/login', [UserController::class, 'login']);
    }
}
