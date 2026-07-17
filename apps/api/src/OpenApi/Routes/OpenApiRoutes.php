<?php

declare(strict_types=1);

namespace App\OpenApi\Routes;

use App\OpenApi\Controllers\OpenApiController;
use Stout\Http\Router;

final class OpenApiRoutes
{
    public static function register(Router $router): void
    {
        $router->get('/api/openapi.json', [OpenApiController::class, 'generate']);
    }
}
