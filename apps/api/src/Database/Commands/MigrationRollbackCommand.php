<?php

declare(strict_types=1);

namespace App\Database\Commands;

use Doctrine\Migrations\DependencyFactory;
use Doctrine\Migrations\MigratorConfiguration;
use Override;
use Stout\Console\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

final class MigrationRollbackCommand extends Command
{
    #[Override]
    public function name(): string
    {
        return 'db:migration:rollback';
    }

    #[Override]
    public function description(): string
    {
        return 'Roll back the last applied database migration';
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

            $previousVersion = $aliasResolver->resolveVersionAlias('prev');
            $plan = $planCalculator->getPlanUntilVersion($previousVersion);

            if (count($plan) === 0) {
                $output->writeln('<info>Nothing to roll back. No migrations have been applied.</info>');
                return 0;
            }

            $currentVersion = $aliasResolver->resolveVersionAlias('current');
            $output->writeln('Rolling back migration: <comment>' . $currentVersion . '</comment>');

            $migratorConfiguration = new MigratorConfiguration();
            $migrator->migrate($plan, $migratorConfiguration);

            $output->writeln('<info>Rollback completed successfully.</info>');
            return 0;
        } catch (\Throwable $e) {
            $output->writeln('<error>Error during rollback: ' . $e->getMessage() . '</error>');
            return 1;
        }
    }
}
