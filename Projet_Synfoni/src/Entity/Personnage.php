<?php

namespace App\Entity;

use App\Repository\PersonnageRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PersonnageRepository::class)]
class Personnage
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $NomPersonnage = null;

    #[ORM\OneToOne(mappedBy: 'IdPersonnage', cascade: ['persist', 'remove'])]
    private ?Caracteristique $Aura = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNomPersonnage(): ?string
    {
        return $this->NomPersonnage;
    }

    public function setNomPersonnage(string $NomPersonnage): static
    {
        $this->NomPersonnage = $NomPersonnage;

        return $this;
    }

    public function getAura(): ?Caracteristique
    {
        return $this->Aura;
    }

    public function setAura(Caracteristique $Aura): static
    {
        // set the owning side of the relation if necessary
        if ($Aura->getIdPersonnage() !== $this) {
            $Aura->setIdPersonnage($this);
        }

        $this->Aura = $Aura;

        return $this;
    }
}
