<?php

declare(strict_types=1);

use App\Database\Commands\MigrateCommand;
use App\Database\Commands\MigrationDiffCommand;
use App\Database\Commands\MigrationGenerateCommand;
use App\Database\Commands\MigrationRollbackCommand;
use App\Database\Providers\DatabaseServiceProvider;
use App\Logging\Providers\LoggingServiceProvider;
use App\OpenApi\Controllers\OpenApiController;
use App\Proxy\Controllers\ProxyController;
use App\User\Controllers\UserController;
use App\User\Middleware\AuthMiddleware;
use App\User\Middleware\CorsMiddleware;
use Stout\Application;
use Stout\Http\Router;

require __DIR__ . '/vendor/autoload.php';

$app = new Application(
    basePath: __DIR__,
    providers: [
        DatabaseServiceProvider::class,
        LoggingServiceProvider::class,
    ],
    commands: [
        MigrateCommand::class,
        MigrationDiffCommand::class,
        MigrationGenerateCommand::class,
        MigrationRollbackCommand::class,
    ]
);

$app->config()->loadGroup('app', [
    'name' => 'postbud'
]);

$app->config()->loadGroup('jwt', [
    'secret' => 'postbud'
]);

$httpKernel = $app->http();

$httpKernel->routes(function (Router $router) use ($app): void {
    $authMiddleware = $app->make(AuthMiddleware::class);

    // Root
    $router->get('/', fn () => 'Api OK');

    // OpenAPI spec
    $router->get('/api/openapi.json', [OpenApiController::class, 'generate']);

    // --- Public auth routes ---
    $router->post('/api/register', [UserController::class, 'register']);
    $router->post('/api/login',    [UserController::class, 'login']);

    // --- Public proxy route (sandbox forwarding) ---
    $router->post('/api/proxy', [ProxyController::class, 'forward']);

    // --- Protected user routes ---
    $router->get('/api/me', [UserController::class, 'me'])->add($authMiddleware);
    $router->get('/api/users', [UserController::class, 'index'])->add($authMiddleware);
    $router->put('/api/users/{id:\d+}', [UserController::class, 'update'])->add($authMiddleware);
});

// Bootstrap routing + error middleware, then add CORS as the outermost layer.
$httpKernel->bootstrap()->middleware(
    $app->make(CorsMiddleware::class)
);

if (PHP_SAPI === 'cli' && !getenv('RR_MODE')) {
    exit($app->runCli($argv));
} else {
    // Call run() directly — bootstrap() is already done above.
    $httpKernel->run();
}
