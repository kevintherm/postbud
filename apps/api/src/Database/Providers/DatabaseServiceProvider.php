<?php

declare(strict_types=1);

namespace App\Database\Providers;

use DI\ContainerBuilder;
use Doctrine\DBAL\DriverManager;
use Doctrine\Migrations\Configuration\EntityManager\ExistingEntityManager;
use Doctrine\Migrations\Configuration\Migration\ConfigurationArray;
use Doctrine\Migrations\DependencyFactory;
use Doctrine\Migrations\MigratorConfiguration;
use Doctrine\ORM\EntityManager;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\ORMSetup;
use Override;
use Psr\Cache\CacheItemPoolInterface;
use Psr\Container\ContainerInterface;
use Stout\Support\ServiceProvider;
use Symfony\Component\Cache\Adapter\FilesystemAdapter;

final class DatabaseServiceProvider implements ServiceProvider
{
    #[Override]
    public function register(ContainerBuilder $builder): void
    {
        // Register Symfony Cache
        $builder->addDefinitions([
            CacheItemPoolInterface::class => function () {
                $cacheDir = dirname(__DIR__, 3) . '/storage/cache';
                if (!is_dir($cacheDir)) {
                    mkdir($cacheDir, 0755, true);
                }
                return new FilesystemAdapter('postbud_cache', 0, $cacheDir);
            },
        ]);

        // Register Doctrine EntityManager
        $builder->addDefinitions([
            EntityManagerInterface::class => function (ContainerInterface $container) {
                $cache = $container->get(CacheItemPoolInterface::class);
                $modelsDir = dirname(__DIR__, 3) . '/src';

                if (!is_dir($modelsDir)) {
                    mkdir($modelsDir, 0755, true);
                }

                $config = ORMSetup::createAttributeMetadataConfiguration(
                    paths: [$modelsDir],
                    isDevMode: true,
                );

                $config->setMetadataCache($cache);
                $config->setQueryCache($cache);
                $config->setResultCache($cache);

                $dbPath = dirname(__DIR__, 3) . '/database/database.sqlite';
                $connectionParams = [
                    'driver' => 'pdo_sqlite',
                    'path' => $dbPath,
                ];

                $connection = DriverManager::getConnection($connectionParams, $config);
                return new EntityManager($connection, $config);
            },
        ]);

        // Register Doctrine Migrations DependencyFactory
        $builder->addDefinitions([
            DependencyFactory::class => function (ContainerInterface $container) {
                $entityManager = $container->get(EntityManagerInterface::class);
                $migrationsDir = dirname(__DIR__, 3) . '/database/migrations';

                if (!is_dir($migrationsDir)) {
                    mkdir($migrationsDir, 0755, true);
                }

                $migrationsConfig = new ConfigurationArray([
                    'table_storage' => [
                        'table_name' => 'doctrine_migration_versions',
                    ],
                    'migrations_paths' => [
                        'Database\\Migrations' => $migrationsDir,
                    ],
                    'all_or_nothing' => true,
                    'transactional' => true,
                ]);

                return DependencyFactory::fromEntityManager($migrationsConfig, new ExistingEntityManager($entityManager));
            },
        ]);
    }

    /**
     * @psalm-suppress InternalMethod
     * @psalm-suppress InternalClass
     */
    #[Override]
    public function boot(ContainerInterface $container): void
    {
        // Automatically run pending migrations on application boot
        /** @var DependencyFactory $dependencyFactory */
        $dependencyFactory = $container->get(DependencyFactory::class);
        $migrator = $dependencyFactory->getMigrator();
        $planCalculator = $dependencyFactory->getMigrationPlanCalculator();
        $aliasResolver = $dependencyFactory->getVersionAliasResolver();

        try {
            $dependencyFactory->getMetadataStorage()->ensureInitialized();
            $plan = $planCalculator->getPlanUntilVersion($aliasResolver->resolveVersionAlias('latest'));
            if (count($plan) > 0) {
                $migratorConfiguration = new MigratorConfiguration();
                $migrator->migrate($plan, $migratorConfiguration);
            }
        } catch (\Throwable $e) {
            fwrite(STDERR, "Migration boot failed: " . $e->getMessage() . "\n");
        }
    }
}
