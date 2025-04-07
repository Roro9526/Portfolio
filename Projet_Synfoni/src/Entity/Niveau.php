<?php

namespace App\Entity;

use App\Repository\NiveauRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: NiveauRepository::class)]
class Niveau
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    /**
     * @var Collection<int, Scenario>
     */
    #[ORM\OneToMany(targetEntity: Scenario::class, mappedBy: 'niveau')]
    private Collection $IdScenario;

    #[ORM\Column(length: 255)]
    private ?string $NomNiveau = null;

    #[ORM\Column(length: 255)]
    private ?string $TextNiveau = null;

    /**
     * @var Collection<int, Choix>
     */
    #[ORM\OneToMany(targetEntity: Choix::class, mappedBy: 'LeNiveau')]
    private Collection $LesChoix;

    #[ORM\ManyToOne(inversedBy: 'LesNiveaux')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Scenario $LeScenario = null;


    public function __construct()
    {
        $this->IdScenario = new ArrayCollection();
        $this->LesChoix = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    /**
     * @return Collection<int, Scenario>
     */
    public function getIdScenario(): Collection
    {
        return $this->IdScenario;
    }

    public function addIdScenario(Scenario $idScenario): static
    {
        if (!$this->IdScenario->contains($idScenario)) {
            $this->IdScenario->add($idScenario);
            $idScenario->setNiveau($this);
        }

        return $this;
    }

    public function removeIdScenario(Scenario $idScenario): static
    {
        if ($this->IdScenario->removeElement($idScenario)) {
            // set the owning side to null (unless already changed)
            if ($idScenario->getNiveau() === $this) {
                $idScenario->setNiveau(null);
            }
        }

        return $this;
    }

    public function getNomNiveau(): ?string
    {
        return $this->NomNiveau;
    }

    public function setNomNiveau(string $NomNiveau): static
    {
        $this->NomNiveau = $NomNiveau;

        return $this;
    }

    public function getTextNiveau(): ?string
    {
        return $this->TextNiveau;
    }

    public function setTextNiveau(string $TextNiveau): static
    {
        $this->TextNiveau = $TextNiveau;

        return $this;
    }

    /**
     * @return Collection<int, Choix>
     */
    public function getLesChoix(): Collection
    {
        return $this->LesChoix;
    }

    public function addLesChoix(Choix $lesChoix): static
    {
        if (!$this->LesChoix->contains($lesChoix)) {
            $this->LesChoix->add($lesChoix);
            $lesChoix->setLeNiveau($this);
        }

        return $this;
    }

    public function removeLesChoix(Choix $lesChoix): static
    {
        if ($this->LesChoix->removeElement($lesChoix)) {
            // set the owning side to null (unless already changed)
            if ($lesChoix->getLeNiveau() === $this) {
                $lesChoix->setLeNiveau(null);
            }
        }

        return $this;
    }

    public function getLeScenario(): ?Scenario
    {
        return $this->LeScenario;
    }

    public function setLeScenario(?Scenario $LeScenario): static
    {
        $this->LeScenario = $LeScenario;

        return $this;
    }

    public function __toString(): string
    {
        return $this->NomNiveau;
    }
}
