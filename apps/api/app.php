<?php

use Stout\Application;
use Stout\Http\Router;

require __DIR__ . '/vendor/autoload.php';

$app = new Application(__DIR__);

$app->http()->routes(function (Router $router) {

    $router->get('/', fn() => 'Hello World');

});

$app->run();