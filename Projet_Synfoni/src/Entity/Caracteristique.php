<?php

namespace App\Entity;

use App\Repository\CaracteristiqueRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CaracteristiqueRepository::class)]
class Caracteristique
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToOne(inversedBy: 'Aura', cascade: ['persist', 'remove'])]
    #[ORM\JoinColumn(nullable: false)]
    private ?Personnage $IdPersonnage = null;

    #[ORM\Column(nullable: true)]
    private ?int $Aura = null;

    #[ORM\Column(nullable: true)]
    private ?int $Humour = null;

    #[ORM\Column(nullable: true)]
    private ?int $Charisme = null;

    #[ORM\Column(nullable: true)]
    private ?int $Pertinence = null;

    #[ORM\Column(nullable: true)]
    private ?int $Intelligence = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getIdPersonnage(): ?Personnage
    {
        return $this->IdPersonnage;
    }

    public function setIdPersonnage(Personnage $IdPersonnage): static
    {
        $this->IdPersonnage = $IdPersonnage;

        return $this;
    }

    public function getAura(): ?int
    {
        return $this->Aura;
    }

    public function setAura(?int $Aura): static
    {
        $this->Aura = $Aura;

        return $this;
    }

    public function getHumour(): ?int
    {
        return $this->Humour;
    }

    public function setHumour(?int $Humour): static
    {
        $this->Humour = $Humour;

        return $this;
    }

    public function getCharisme(): ?int
    {
        return $this->Charisme;
    }

    public function setCharisme(?int $Charisme): static
    {
        $this->Charisme = $Charisme;

        return $this;
    }

    public function getPertinence(): ?int
    {
        return $this->Pertinence;
    }

    public function setPertinence(?int $Pertinence): static
    {
        $this->Pertinence = $Pertinence;

        return $this;
    }

    public function getIntelligence(): ?int
    {
        return $this->Intelligence;
    }

    public function setIntelligence(?int $Intelligence): static
    {
        $this->Intelligence = $Intelligence;

        return $this;
    }
}
