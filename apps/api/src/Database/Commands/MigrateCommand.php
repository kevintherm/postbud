<?php

declare(strict_types=1);

namespace App\Database\Commands;

use Doctrine\Migrations\DependencyFactory;
use Doctrine\Migrations\MigratorConfiguration;
use Override;
use Stout\Console\Command;

final class MigrateCommand extends Command
{
    #[Override]
    public function name(): string
    {
        return 'db:migrate';
    }

    #[Override]
    public function description(): string
    {
        return 'Run pending database migrations';
    }

    /**
     * @psalm-suppress InternalMethod
     * @psalm-suppress InternalClass
     */
    #[Override]
    public function execute(array $args): int
    {
        /** @var DependencyFactory $dependencyFactory */
        $dependencyFactory = $this->container->get(DependencyFactory::class);
        $migrator = $dependencyFactory->getMigrator();
        $planCalculator = $dependencyFactory->getMigrationPlanCalculator();
        $aliasResolver = $dependencyFactory->getVersionAliasResolver();

        try {
            $dependencyFactory->getMetadataStorage()->ensureInitialized();
            $plan = $planCalculator->getPlanUntilVersion($aliasResolver->resolveVersionAlias('latest'));

            if (count($plan) === 0) {
                echo "No pending migrations to run.\n";
                return 0;
            }

            echo "Running " . count($plan) . " migrations...\n";
            $migratorConfiguration = new MigratorConfiguration();
            $migrator->migrate($plan, $migratorConfiguration);
            echo "Migrations completed successfully!\n";
            return 0;
        } catch (\Throwable $e) {
            fwrite(STDERR, "Error running migrations: " . $e->getMessage() . "\n");
            return 1;
        }
    }
}
