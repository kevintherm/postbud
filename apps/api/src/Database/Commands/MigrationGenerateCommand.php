<?php

declare(strict_types=1);

namespace App\Database\Commands;

use Doctrine\Migrations\DependencyFactory;
use Override;
use Stout\Console\Command;

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
    public function execute(array $args): int
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
                fwrite(STDERR, "Error: No migration directories configured.\n");
                return 1;
            }

            $fqcn = $classNameGenerator->generateClassName($namespace);
            $path = $migrationGenerator->generateMigration($fqcn);

            echo "Generated new migration class: {$fqcn}\n";
            echo "Path: {$path}\n";
            return 0;
        } catch (\Throwable $e) {
            fwrite(STDERR, "Error generating migration: " . $e->getMessage() . "\n");
            return 1;
        }
    }
}
