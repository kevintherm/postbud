<?php

declare(strict_types=1);

namespace Database\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Request history for storing executed request logs
 */
final class Version20260717100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create request_history table for storing executed request logs';
    }

    public function up(Schema $schema): void
    {
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\SQLitePlatform,
            "Migration can only be executed safely on '\Doctrine\DBAL\Platforms\SQLitePlatform'."
        );

        $this->addSql('
            CREATE TABLE request_history (
                id VARCHAR(36) PRIMARY KEY NOT NULL,
                user_id INTEGER NOT NULL,
                request_id VARCHAR(36) NULL,
                method VARCHAR(10) NOT NULL,
                url VARCHAR(2048) NOT NULL,
                request_headers TEXT NOT NULL DEFAULT \'[]\',
                request_params TEXT NOT NULL DEFAULT \'[]\',
                request_body TEXT NULL,
                status_code INTEGER NULL,
                response_headers TEXT NOT NULL DEFAULT \'[]\',
                response_body TEXT NULL,
                timing_ms INTEGER NULL,
                response_size INTEGER NULL,
                executed_at DATETIME NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE SET NULL
            )
        ');
        $this->addSql('CREATE INDEX idx_history_user ON request_history (user_id)');
        $this->addSql('CREATE INDEX idx_history_request ON request_history (request_id)');
        $this->addSql('CREATE INDEX idx_history_executed_at ON request_history (executed_at)');
    }

    public function down(Schema $schema): void
    {
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\SQLitePlatform,
            "Migration can only be executed safely on '\Doctrine\DBAL\Platforms\SQLitePlatform'."
        );

        $this->addSql('DROP TABLE request_history');
    }
}
