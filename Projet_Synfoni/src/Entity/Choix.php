<?php

namespace App\Entity;

use App\Repository\ChoixRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ChoixRepository::class)]
class Choix
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;


    #[ORM\Column(length: 255)]
    private ?string $NomChoix = null;

    #[ORM\Column(length: 255)]
    private ?string $TextChoix = null;

    #[ORM\Column(type: Types::ARRAY)]
    private array $ConsequenceChoix = [];

    #[ORM\ManyToOne(inversedBy: 'LesChoix')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Niveau $LeNiveau = null;

    public function __construct() {}

    public function getId(): ?int
    {
        return $this->id;
    }



    public function getNomChoix(): ?string
    {
        return $this->NomChoix;
    }

    public function setNomChoix(string $NomChoix): static
    {
        $this->NomChoix = $NomChoix;

        return $this;
    }

    public function getTextChoix(): ?string
    {
        return $this->TextChoix;
    }

    public function setTextChoix(string $TextChoix): static
    {
        $this->TextChoix = $TextChoix;

        return $this;
    }

    public function getConsequenceChoix(): array
    {
        return $this->ConsequenceChoix;
    }

    public function setConsequenceChoix(array $ConsequenceChoix): static
    {
        $this->ConsequenceChoix = $ConsequenceChoix;

        return $this;
    }

    public function getLeNiveau(): ?Niveau
    {
        return $this->LeNiveau;
    }

    public function setLeNiveau(?Niveau $LeNiveau): static
    {
        $this->LeNiveau = $LeNiveau;

        return $this;
    }

    public function __toString(): string
    {
        return $this->LeNiveau;
    }
}
