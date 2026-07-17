<?php

declare(strict_types=1);

namespace App\Proxy\Routes;

use App\Proxy\Controllers\ProxyController;
use Stout\Http\Router;

final class ProxyRoutes
{
    public static function register(Router $router): void
    {
        $router->post('/api/proxy', [ProxyController::class, 'forward']);
    }
}
