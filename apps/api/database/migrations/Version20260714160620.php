<?php

declare(strict_types=1);

namespace Database\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260714160620 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create users, collections, request templates, environments, and history tables';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, email VARCHAR(255) NOT NULL, password VARCHAR(255) NOT NULL, token VARCHAR(255) DEFAULT NULL, verified_at DATETIME DEFAULT NULL)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_1483A5E9E7927C74 ON users (email)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_1483A5E95F37A13B ON users (token)');

        $this->addSql('CREATE TABLE collections (id VARCHAR(255) NOT NULL, name VARCHAR(255) NOT NULL, user_id INTEGER DEFAULT NULL, PRIMARY KEY(id), CONSTRAINT FK_C28A131EA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE)');
        $this->addSql('CREATE INDEX IDX_C28A131EA76ED395 ON collections (user_id)');

        $this->addSql('CREATE TABLE request_templates (id VARCHAR(255) NOT NULL, collection_id VARCHAR(255) DEFAULT NULL, name VARCHAR(255) NOT NULL, method VARCHAR(255) NOT NULL, url VARCHAR(255) NOT NULL, headers CLOB NOT NULL, params CLOB NOT NULL, body TEXT NOT NULL, PRIMARY KEY(id), CONSTRAINT FK_3EAA3C78514956FD FOREIGN KEY (collection_id) REFERENCES collections (id) ON DELETE CASCADE)');
        $this->addSql('CREATE INDEX IDX_3EAA3C78514956FD ON request_templates (collection_id)');

        $this->addSql('CREATE TABLE environments (id VARCHAR(255) NOT NULL, name VARCHAR(255) NOT NULL, user_id INTEGER DEFAULT NULL, variables CLOB NOT NULL, PRIMARY KEY(id), CONSTRAINT FK_A505F251A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE)');
        $this->addSql('CREATE INDEX IDX_A505F251A76ED395 ON environments (user_id)');

        $this->addSql('CREATE TABLE history_entries (id VARCHAR(255) NOT NULL, user_id INTEGER DEFAULT NULL, url VARCHAR(255) NOT NULL, method VARCHAR(255) NOT NULL, status INTEGER NOT NULL, time INTEGER NOT NULL, size INTEGER NOT NULL, timestamp INTEGER NOT NULL, PRIMARY KEY(id), CONSTRAINT FK_2ED35039A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE)');
        $this->addSql('CREATE INDEX IDX_2ED35039A76ED395 ON history_entries (user_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE history_entries');
        $this->addSql('DROP TABLE environments');
        $this->addSql('DROP TABLE request_templates');
        $this->addSql('DROP TABLE collections');
        $this->addSql('DROP TABLE users');
    }
}
