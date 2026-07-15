<?php

declare(strict_types=1);

use App\Database\Commands\MigrateCommand;
use App\Database\Commands\MigrationGenerateCommand;
use App\Database\Providers\DatabaseServiceProvider;
use App\Logging\Providers\LoggingServiceProvider;
use App\OpenApi\Controllers\OpenApiController;
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
        MigrationGenerateCommand::class,
    ]
);

$app->config()->loadGroup('app', [
    'name' => 'postbud'
]);

$app->http()->routes(function (Router $router) {
    $router->get('/', fn () => 'Hello World');
    $router->get('/api/openapi.json', [OpenApiController::class, 'generate']);
});

if (PHP_SAPI === 'cli' && !getenv('RR_MODE')) {
    exit($app->runCli($argv));
} else {
    $app->run();
}
