<?php

declare(strict_types=1);

namespace Database\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260717120151 extends AbstractMigration
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

        $this->addSql('CREATE TEMPORARY TABLE __temp__requests AS SELECT id, name, method, url, headers, params, body, sort_order, created_at, updated_at, deleted_at, collection_id FROM requests');
        $this->addSql('DROP TABLE requests');
        $this->addSql('CREATE TABLE requests (id VARCHAR(36) NOT NULL, name VARCHAR(255) NOT NULL, method VARCHAR(10) NOT NULL, url VARCHAR(2048) NOT NULL, headers CLOB NOT NULL, params CLOB NOT NULL, body CLOB DEFAULT NULL, sort_order INTEGER NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, deleted_at DATETIME DEFAULT NULL, collection_id VARCHAR(36) DEFAULT NULL, user_id INTEGER NOT NULL, PRIMARY KEY (id), CONSTRAINT FK_7B85D651514956FD FOREIGN KEY (collection_id) REFERENCES collections (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_7B85D651A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO requests (id, name, method, url, headers, params, body, sort_order, created_at, updated_at, deleted_at, collection_id) SELECT id, name, method, url, headers, params, body, sort_order, created_at, updated_at, deleted_at, collection_id FROM __temp__requests');
        $this->addSql('DROP TABLE __temp__requests');
        $this->addSql('CREATE INDEX idx_request_collection ON requests (collection_id)');
        $this->addSql('CREATE INDEX IDX_7B85D651A76ED395 ON requests (user_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\SQLitePlatform,
            "Migration can only be executed safely on '\Doctrine\DBAL\Platforms\SQLitePlatform'."
        );

        $this->addSql('CREATE TEMPORARY TABLE __temp__requests AS SELECT id, name, method, url, headers, params, body, sort_order, created_at, updated_at, deleted_at, collection_id FROM requests');
        $this->addSql('DROP TABLE requests');
        $this->addSql('CREATE TABLE requests (id VARCHAR(36) NOT NULL, name VARCHAR(255) NOT NULL, method VARCHAR(10) NOT NULL, url VARCHAR(2048) NOT NULL, headers CLOB NOT NULL, params CLOB NOT NULL, body CLOB DEFAULT NULL, sort_order INTEGER NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, deleted_at DATETIME DEFAULT NULL, collection_id VARCHAR(36) NOT NULL, PRIMARY KEY (id), CONSTRAINT FK_7B85D651514956FD FOREIGN KEY (collection_id) REFERENCES collections (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO requests (id, name, method, url, headers, params, body, sort_order, created_at, updated_at, deleted_at, collection_id) SELECT id, name, method, url, headers, params, body, sort_order, created_at, updated_at, deleted_at, collection_id FROM __temp__requests');
        $this->addSql('DROP TABLE __temp__requests');
        $this->addSql('CREATE INDEX idx_request_collection ON requests (collection_id)');
    }
}
