<?php

declare(strict_types=1);

namespace Database\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260717102222 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\SQLitePlatform,
            "Migration can only be executed safely on '\Doctrine\DBAL\Platforms\SQLitePlatform'."
        );

        $this->addSql('CREATE TEMPORARY TABLE __temp__request_history AS SELECT id, user_id, request_id, method, url, request_headers, request_params, request_body, status_code, response_headers, response_body, timing_ms, response_size, executed_at FROM request_history');
        $this->addSql('DROP TABLE request_history');
        $this->addSql('CREATE TABLE request_history (id VARCHAR(36) NOT NULL, user_id INTEGER NOT NULL, request_id VARCHAR(36) DEFAULT NULL, method VARCHAR(10) NOT NULL, url VARCHAR(2048) NOT NULL, request_headers CLOB NOT NULL, request_params CLOB NOT NULL, request_body CLOB DEFAULT NULL, status_code INTEGER DEFAULT NULL, response_headers CLOB NOT NULL, response_body CLOB DEFAULT NULL, timing_ms INTEGER DEFAULT NULL, response_size INTEGER DEFAULT NULL, executed_at DATETIME NOT NULL, PRIMARY KEY (id), CONSTRAINT FK_D9E021CA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_D9E021C427EB8A5 FOREIGN KEY (request_id) REFERENCES requests (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO request_history (id, user_id, request_id, method, url, request_headers, request_params, request_body, status_code, response_headers, response_body, timing_ms, response_size, executed_at) SELECT id, user_id, request_id, method, url, request_headers, request_params, request_body, status_code, response_headers, response_body, timing_ms, response_size, executed_at FROM __temp__request_history');
        $this->addSql('DROP TABLE __temp__request_history');
        $this->addSql('CREATE INDEX idx_history_request ON request_history (request_id)');
        $this->addSql('CREATE INDEX idx_history_user ON request_history (user_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\SQLitePlatform,
            "Migration can only be executed safely on '\Doctrine\DBAL\Platforms\SQLitePlatform'."
        );

        $this->addSql('CREATE TEMPORARY TABLE __temp__request_history AS SELECT id, method, url, request_headers, request_params, request_body, status_code, response_headers, response_body, timing_ms, response_size, executed_at, user_id, request_id FROM request_history');
        $this->addSql('DROP TABLE request_history');
        $this->addSql('CREATE TABLE request_history (id VARCHAR(36) NOT NULL, method VARCHAR(10) NOT NULL, url VARCHAR(2048) NOT NULL, request_headers CLOB DEFAULT \'[]\' NOT NULL, request_params CLOB DEFAULT \'[]\' NOT NULL, request_body CLOB DEFAULT NULL, status_code INTEGER DEFAULT NULL, response_headers CLOB DEFAULT \'[]\' NOT NULL, response_body CLOB DEFAULT NULL, timing_ms INTEGER DEFAULT NULL, response_size INTEGER DEFAULT NULL, executed_at DATETIME NOT NULL, user_id INTEGER NOT NULL, request_id VARCHAR(36) DEFAULT NULL, PRIMARY KEY (id), FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, FOREIGN KEY (request_id) REFERENCES requests (id) ON UPDATE NO ACTION ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO request_history (id, method, url, request_headers, request_params, request_body, status_code, response_headers, response_body, timing_ms, response_size, executed_at, user_id, request_id) SELECT id, method, url, request_headers, request_params, request_body, status_code, response_headers, response_body, timing_ms, response_size, executed_at, user_id, request_id FROM __temp__request_history');
        $this->addSql('DROP TABLE __temp__request_history');
        $this->addSql('CREATE INDEX idx_history_user ON request_history (user_id)');
        $this->addSql('CREATE INDEX idx_history_request ON request_history (request_id)');
        $this->addSql('CREATE INDEX idx_history_executed_at ON request_history (executed_at)');
    }
}
