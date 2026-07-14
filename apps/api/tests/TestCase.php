<?php

declare(strict_types=1);

namespace Tests;

use PHPUnit\Framework\TestCase as BaseTestCase;
use Stout\Application;
use Doctrine\ORM\EntityManagerInterface;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Factory\StreamFactory;
use Psr\Http\Message\ResponseInterface;

class TestCase extends BaseTestCase
{
    protected ?Application $app = null;

    protected function setUp(): void
    {
        parent::setUp();

        $_ENV['DB_PATH'] = ':memory:';

        $this->app = new Application(
            basePath: dirname(__DIR__),
            providers: [
                \App\Database\Providers\DatabaseServiceProvider::class,
                \App\Logging\Providers\LoggingServiceProvider::class,
            ]
        );

        $routes = require dirname(__DIR__) . '/routes.php';
        $this->app->http()->routes($routes);
    }

    protected function getEntityManager(): EntityManagerInterface
    {
        return $this->app->make(EntityManagerInterface::class);
    }

    public function request(
        string $method,
        string $path,
        array $body = [],
        array $headers = []
    ): ResponseInterface {
        $factory = new ServerRequestFactory();
        $uri = 'http://localhost' . $path;
        $request = $factory->createServerRequest($method, $uri);

        if (!empty($body)) {
            $streamFactory = new StreamFactory();
            $stream = $streamFactory->createStream(json_encode($body));
            $request = $request->withBody($stream)
                               ->withHeader('Content-Type', 'application/json');
        }

        foreach ($headers as $name => $value) {
            $request = $request->withHeader($name, $value);
        }

        $request = new \Stout\Http\Request($request);

        return $this->app->http()->handle($request);
    }
}
