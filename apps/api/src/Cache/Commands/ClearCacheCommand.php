<?php

namespace App\Cache\Commands;

use Override;
use Psr\Container\ContainerInterface;
use Stout\Config\Config;
use Stout\Console\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

class ClearCacheCommand extends Command
{
    public function __construct(ContainerInterface $container)
    {
        parent::__construct($container);
    }

    #[Override]
    public function name(): string
    {
        return 'cache:clear';
    }

    #[Override]
    public function description(): string
    {
        return 'Clears the cache';
    }

    #[Override]
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $output->writeln('  Clearing cache...');

        /** @var Config $config */
        $config = $this->container->get(Config::class);
        $storagePath = $config->get('app.storage_path');
        $cacheDir = $storagePath . '/cache';
        if (!is_dir($cacheDir)) {
            $output->writeln('  Cache directory does not exist. Skipping...');
        } else {
            $output->writeln('  Cache directory exists. Clearing...');
            $this->removeDir($cacheDir, $output);
        }

        // Redis or whatever

        $output->writeln('  Cache cleared successfully');

        return 0;
    }

    private function removeDir(string $dir, OutputInterface $output): void
    {
        $items = scandir($dir);
        if ($items === false) {
            return;
        }

        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }

            $path = $dir . DIRECTORY_SEPARATOR . $item;

            if (is_dir($path)) {
                $this->removeDir($path, $output);
            } else {
                unlink($path);
            }
        }

        rmdir($dir);
    }
}

