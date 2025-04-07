<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250115142458 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE choix ADD le_niveau_id INT NOT NULL');
        $this->addSql('ALTER TABLE choix ADD CONSTRAINT FK_4F488091D2268876 FOREIGN KEY (le_niveau_id) REFERENCES niveau (id)');
        $this->addSql('CREATE INDEX IDX_4F488091D2268876 ON choix (le_niveau_id)');
        $this->addSql('ALTER TABLE niveau DROP FOREIGN KEY FK_4BDFF36BD9144651');
        $this->addSql('DROP INDEX IDX_4BDFF36BD9144651 ON niveau');
        $this->addSql('ALTER TABLE niveau DROP choix_id');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE choix DROP FOREIGN KEY FK_4F488091D2268876');
        $this->addSql('DROP INDEX IDX_4F488091D2268876 ON choix');
        $this->addSql('ALTER TABLE choix DROP le_niveau_id');
        $this->addSql('ALTER TABLE niveau ADD choix_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE niveau ADD CONSTRAINT FK_4BDFF36BD9144651 FOREIGN KEY (choix_id) REFERENCES choix (id)');
        $this->addSql('CREATE INDEX IDX_4BDFF36BD9144651 ON niveau (choix_id)');
    }
}
