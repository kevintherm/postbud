<?php

declare(strict_types=1);

namespace App\Database\Commands;

use Doctrine\Migrations\DependencyFactory;
use Doctrine\Migrations\Generator\Exception\NoChangesDetected;
use Override;
use Stout\Console\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

final class MigrationDiffCommand extends Command
{
    #[Override]
    public function name(): string
    {
        return 'db:migration:diff';
    }

    #[Override]
    public function description(): string
    {
        return 'Generate a migration by diffing ORM entities against the current database schema';
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

        $configuration = $dependencyFactory->getConfiguration();
        $migrationPaths = $configuration->getMigrationDirectories();
        $namespace = key($migrationPaths);

        if ($namespace === null) {
            $output->writeln('<error>Error: No migration directories configured.</error>');
            return 1;
        }

        try {
            // Build the fully-qualified class name for the new migration.
            $classNameGenerator = $dependencyFactory->getClassNameGenerator();
            $fqcn = $classNameGenerator->generateClassName($namespace);

            $path = $dependencyFactory->getDiffGenerator()->generate($fqcn, null, false, null, 120);

            $output->writeln('<info>Generated diff migration:</info>');
            $output->writeln($path);

            return 0;
        } catch (NoChangesDetected) {
            $output->writeln('<info>No schema differences detected. No migration generated.</info>');
            return 0;
        } catch (\Throwable $e) {
            $output->writeln('<error>Error generating diff: ' . $e->getMessage() . '</error>');
            return 1;
        }
    }
}
