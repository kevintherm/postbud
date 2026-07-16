<?php

declare(strict_types=1);

namespace App\Database\Commands;

use Doctrine\Migrations\DependencyFactory;
use Override;
use Stout\Console\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

final class MigrationGenerateCommand extends Command
{
    #[Override]
    public function name(): string
    {
        return 'db:migration:generate';
    }

    #[Override]
    public function description(): string
    {
        return 'Generate a blank database migration';
    }

    /**
     * @psalm-suppress InternalMethod
     */
    #[Override]
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        /** @var DependencyFactory $dependencyFactory */
        $dependencyFactory = $this->container->get(DependencyFactory::class);
        $classNameGenerator = $dependencyFactory->getClassNameGenerator();
        $migrationGenerator = $dependencyFactory->getMigrationGenerator();
        $configuration = $dependencyFactory->getConfiguration();

        try {
            $migrationPaths = $configuration->getMigrationDirectories();
            $namespace = key($migrationPaths);

            if ($namespace === null) {
                $output->writeln('<error>Error: No migration directories configured.</error>');
                return 1;
            }

            $fqcn = $classNameGenerator->generateClassName($namespace);
            $path = $migrationGenerator->generateMigration($fqcn);

            $output->writeln("Generated new migration class: {$fqcn}");
            $output->writeln("Path: {$path}");
            return 0;
        } catch (\Throwable $e) {
            $output->writeln('<error>Error generating migration: ' . $e->getMessage() . '</error>');
            return 1;
        }
    }
}
