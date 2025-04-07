<?php

namespace App\Entity;

use App\Repository\ScenarioRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ScenarioRepository::class)]
class Scenario
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $NomScenario = null;


    /**
     * @var Collection<int, Niveau>
     */
    #[ORM\OneToMany(targetEntity: Niveau::class, mappedBy: 'LeScenario', orphanRemoval: true)]
    private Collection $LesNiveaux;

    #[ORM\Column(length: 1024)]
    private ?string $Description = null;

    public function __construct()
    {
        $this->LesNiveaux = new ArrayCollection();
    }

    // #[ORM\ManyToOne(inversedBy: 'IdScenario')]
    // private ?Niveau $niveau = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNomScenario(): ?string
    {
        return $this->NomScenario;
    }

    public function setNomScenario(string $NomScenario): static
    {
        $this->NomScenario = $NomScenario;

        return $this;
    }



    // public function getNiveau(): ?Niveau
    // {
    //     return $this->niveau;
    // }

    // public function setNiveau(?Niveau $niveau): static
    // {
    //     $this->niveau = $niveau;

    //     return $this;
    // }

    /**
     * @return Collection<int, Niveau>
     */
    public function getLesNiveaux(): Collection
    {
        return $this->LesNiveaux;
    }

    public function addLesNiveau(Niveau $lesNiveau): static
    {
        if (!$this->LesNiveaux->contains($lesNiveau)) {
            $this->LesNiveaux->add($lesNiveau);
            $lesNiveau->setLeScenario($this);
        }

        return $this;
    }

    public function removeLesNiveau(Niveau $lesNiveau): static
    {
        if ($this->LesNiveaux->removeElement($lesNiveau)) {
            // set the owning side to null (unless already changed)
            if ($lesNiveau->getLeScenario() === $this) {
                $lesNiveau->setLeScenario(null);
            }
        }

        return $this;
    }

    public function __toString(): string
    {
        return $this->NomScenario;
    }

    public function getDescription(): ?string
    {
        return $this->Description;
    }

    public function setDescription(string $Description): static
    {
        $this->Description = $Description;

        return $this;
    }
}
