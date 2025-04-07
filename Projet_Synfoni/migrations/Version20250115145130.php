<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250115145130 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE niveau ADD le_scenario_id INT NOT NULL');
        $this->addSql('ALTER TABLE niveau ADD CONSTRAINT FK_4BDFF36BA16933C0 FOREIGN KEY (le_scenario_id) REFERENCES scenario (id)');
        $this->addSql('CREATE INDEX IDX_4BDFF36BA16933C0 ON niveau (le_scenario_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE niveau DROP FOREIGN KEY FK_4BDFF36BA16933C0');
        $this->addSql('DROP INDEX IDX_4BDFF36BA16933C0 ON niveau');
        $this->addSql('ALTER TABLE niveau DROP le_scenario_id');
    }
}
