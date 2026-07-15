<?php

declare(strict_types=1);

namespace App\Database\Commands;

use Doctrine\Migrations\DependencyFactory;
use Doctrine\Migrations\MigratorConfiguration;
use Override;
use Stout\Console\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

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
    protected function execute(InputInterface $input, OutputInterface $output): int
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
                $output->writeln("No pending migrations to run.");
                return 0;
            }

            $output->writeln("Running " . count($plan) . " migrations...");
            $migratorConfiguration = new MigratorConfiguration();
            $migrator->migrate($plan, $migratorConfiguration);
            $output->writeln("<info>Migrations completed successfully!</info>");
            return 0;
        } catch (\Throwable $e) {
            $output->writeln("<error>Error running migrations: " . $e->getMessage() . "</error>");
            return 1;
        }
    }
}
