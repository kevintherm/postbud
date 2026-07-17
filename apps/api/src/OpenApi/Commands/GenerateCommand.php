<?php

declare(strict_types=1);

namespace App\OpenApi\Commands;

use OpenApi\Generator;
use Override;
use Psr\Container\ContainerInterface;
use Stout\Console\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

final class GenerateCommand extends Command
{
    public function __construct(ContainerInterface $container)
    {
        parent::__construct($container);
    }

    #[Override]
    public function name(): string
    {
        return 'openapi:generate';
    }

    #[Override]
    public function description(): string
    {
        return 'Generates a static OpenAPI JSON specification file';
    }

    #[Override]
    protected function configure(): void
    {
        $this->addOption(
            'output',
            'o',
            InputOption::VALUE_REQUIRED,
            'Path to write the generated OpenAPI JSON file',
            dirname(__DIR__, 5) . '/shared/openapi/openapi.json'
        );
    }

    #[Override]
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $output->writeln('Scanning src directory for OpenAPI annotations...');

        // Scan the src directory
        $openapi = (new Generator())->generate([dirname(__DIR__, 2)]);

        if ($openapi === null) {
            $output->writeln('<error>Failed to generate OpenAPI specification.</error>');
            return 1;
        }

        $outputPath = $input->getOption('output');
        if (!is_string($outputPath)) {
            $output->writeln('<error>Invalid output path option.</error>');
            return 1;
        }

        $dir = dirname($outputPath);
        if (!is_dir($dir)) {
            if (!mkdir($dir, 0755, true) && !is_dir($dir)) {
                $output->writeln(sprintf('<error>Directory "%s" was not created</error>', $dir));
                return 1;
            }
        }

        $json = $openapi->toJson();
        if (file_put_contents($outputPath, $json) === false) {
            $output->writeln(sprintf('<error>Failed to write OpenAPI JSON to "%s".</error>', $outputPath));
            return 1;
        }

        $output->writeln(sprintf('<info>OpenAPI specification successfully written to "%s".</info>', $outputPath));
        return 0;
    }
}
