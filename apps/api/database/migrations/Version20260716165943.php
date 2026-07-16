<?php

declare(strict_types=1);

namespace Database\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260716165943 extends AbstractMigration
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

        $this->addSql('CREATE TABLE collections (id VARCHAR(36) NOT NULL, name VARCHAR(255) NOT NULL, sort_order INTEGER NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, deleted_at DATETIME DEFAULT NULL, user_id INTEGER NOT NULL, parent_id VARCHAR(36) DEFAULT NULL, PRIMARY KEY (id), CONSTRAINT FK_D325D3EEA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_D325D3EE727ACA70 FOREIGN KEY (parent_id) REFERENCES collections (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX idx_collection_user ON collections (user_id)');
        $this->addSql('CREATE INDEX idx_collection_parent ON collections (parent_id)');
        $this->addSql('CREATE TABLE requests (id VARCHAR(36) NOT NULL, name VARCHAR(255) NOT NULL, method VARCHAR(10) NOT NULL, url VARCHAR(2048) NOT NULL, headers CLOB NOT NULL, params CLOB NOT NULL, body CLOB DEFAULT NULL, sort_order INTEGER NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, deleted_at DATETIME DEFAULT NULL, collection_id VARCHAR(36) NOT NULL, PRIMARY KEY (id), CONSTRAINT FK_7B85D651514956FD FOREIGN KEY (collection_id) REFERENCES collections (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX idx_request_collection ON requests (collection_id)');
        $this->addSql('CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL, password VARCHAR(255) NOT NULL, role VARCHAR(50) NOT NULL, sync_enabled BOOLEAN NOT NULL, created_at DATETIME NOT NULL)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_1483A5E9E7927C74 ON users (email)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\SQLitePlatform,
            "Migration can only be executed safely on '\Doctrine\DBAL\Platforms\SQLitePlatform'."
        );

        $this->addSql('DROP TABLE collections');
        $this->addSql('DROP TABLE requests');
        $this->addSql('DROP TABLE users');
    }
}
