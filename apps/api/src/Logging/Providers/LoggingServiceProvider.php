<?php

declare(strict_types=1);

namespace App\Logging\Providers;

use DI\ContainerBuilder;
use Monolog\Handler\RotatingFileHandler;
use Monolog\Handler\StreamHandler;
use Monolog\Level;
use Monolog\Logger;
use Override;
use Psr\Container\ContainerInterface;
use Psr\Log\LoggerInterface;
use Stout\Support\ServiceProvider;

final class LoggingServiceProvider implements ServiceProvider
{
    #[Override]
    public function register(ContainerBuilder $builder): void
    {
        $builder->addDefinitions([
            LoggerInterface::class => function () {
                $logDir = dirname(__DIR__, 3) . '/storage/logs';
                if (!is_dir($logDir)) {
                    mkdir($logDir, 0755, true);
                }

                $logger = new Logger('postbud');

                $logger->pushHandler(new StreamHandler('php://stderr', Level::Debug));
                $logger->pushHandler(new RotatingFileHandler($logDir . '/app.log', 7, Level::Debug));

                return $logger;
            },
        ]);
    }

    #[Override]
    public function boot(ContainerInterface $container): void
    {
        // No boot logic required
    }
}
