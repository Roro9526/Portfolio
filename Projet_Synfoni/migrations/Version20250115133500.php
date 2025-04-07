<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250115133500 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE caracteristique (id INT AUTO_INCREMENT NOT NULL, id_personnage_id INT NOT NULL, aura INT DEFAULT NULL, humour INT DEFAULT NULL, charisme INT DEFAULT NULL, pertinence INT DEFAULT NULL, intelligence INT DEFAULT NULL, UNIQUE INDEX UNIQ_D14FBE8BE0198227 (id_personnage_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE choix (id INT AUTO_INCREMENT NOT NULL, nom_choix VARCHAR(255) NOT NULL, text_choix VARCHAR(255) NOT NULL, consequence_choix LONGTEXT NOT NULL COMMENT \'(DC2Type:array)\', PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE niveau (id INT AUTO_INCREMENT NOT NULL, choix_id INT DEFAULT NULL, nom_niveau VARCHAR(255) NOT NULL, text_niveau VARCHAR(255) NOT NULL, INDEX IDX_4BDFF36BD9144651 (choix_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE personnage (id INT AUTO_INCREMENT NOT NULL, nom_personnage VARCHAR(255) NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE scenario (id INT AUTO_INCREMENT NOT NULL, niveau_id INT DEFAULT NULL, nom_scenario VARCHAR(255) NOT NULL, description VARCHAR(255) NOT NULL, INDEX IDX_3E45C8D8B3E9C81 (niveau_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE caracteristique ADD CONSTRAINT FK_D14FBE8BE0198227 FOREIGN KEY (id_personnage_id) REFERENCES personnage (id)');
        $this->addSql('ALTER TABLE niveau ADD CONSTRAINT FK_4BDFF36BD9144651 FOREIGN KEY (choix_id) REFERENCES choix (id)');
        $this->addSql('ALTER TABLE scenario ADD CONSTRAINT FK_3E45C8D8B3E9C81 FOREIGN KEY (niveau_id) REFERENCES niveau (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE caracteristique DROP FOREIGN KEY FK_D14FBE8BE0198227');
        $this->addSql('ALTER TABLE niveau DROP FOREIGN KEY FK_4BDFF36BD9144651');
        $this->addSql('ALTER TABLE scenario DROP FOREIGN KEY FK_3E45C8D8B3E9C81');
        $this->addSql('DROP TABLE caracteristique');
        $this->addSql('DROP TABLE choix');
        $this->addSql('DROP TABLE niveau');
        $this->addSql('DROP TABLE personnage');
        $this->addSql('DROP TABLE scenario');
    }
}
