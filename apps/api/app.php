<?php

declare(strict_types=1);

use App\Auth\Routes\AuthRoutes;
use App\Collection\Routes\CollectionRoutes;
use App\Cache\Commands\ClearCacheCommand;
use App\Database\Commands\MigrateCommand;
use App\Database\Commands\MigrationDiffCommand;
use App\Database\Commands\MigrationGenerateCommand;
use App\Database\Commands\MigrationRollbackCommand;
use App\Database\Providers\DatabaseServiceProvider;
use App\Logging\Providers\LoggingServiceProvider;
use App\OpenApi\Commands\GenerateCommand;
use App\Proxy\Routes\ProxyRoutes;
use App\Request\Routes\RequestRoutes;
use App\RequestHistory\Routes\RequestHistoryRoutes;
use App\User\Middleware\AuthMiddleware;
use App\User\Middleware\CorsMiddleware;
use App\User\Routes\UserRoutes;
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
        ClearCacheCommand::class,
        GenerateCommand::class,
    ]
);

$app->config()->loadGroup('app', [
    'name' => 'postbud'
]);

$app->config()->loadGroup('jwt', [
    'secret' => 'postbud'
]);

$httpKernel = $app->http();

$router = new Router();

$authMiddleware = $app->make(AuthMiddleware::class);

// Root
$router->get('/', fn () => 'Api OK');

AuthRoutes::register($router);
ProxyRoutes::register($router);
UserRoutes::register($router, $authMiddleware);
CollectionRoutes::register($router, $authMiddleware);
RequestRoutes::register($router, $authMiddleware);
RequestHistoryRoutes::register($router, $authMiddleware);

$httpKernel->routes($router);

$httpKernel->bootstrap()->middleware(
    $app->make(CorsMiddleware::class)
);

if (PHP_SAPI === 'cli' && !getenv('RR_MODE')) {
    exit($app->runCli($argv));
} else {
    $httpKernel->run();
}
