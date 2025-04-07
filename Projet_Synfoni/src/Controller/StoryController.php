<?php

namespace App\Controller;

use App\Entity\Choix;
use App\Entity\Niveau;
use App\Entity\Scenario;
use App\Entity\Personnage;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

final class StoryController extends AbstractController
{
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        $this->entityManager = $entityManager;
    }

    #[Route('/story', name: 'story')]
    public function index(): Response
    {
        $scenarios = $this->entityManager->getRepository(Scenario::class)->findAll();

        // Générer les slugs pour chaque scénario
        $scenariosWithSlugs = array_map(function ($scenario) {
            return [
                'scenario' => $scenario,
                'slug' => $this->slugify($scenario->getNomScenario())
            ];
        }, $scenarios);

        return $this->render('story/index.html.twig', [
            'scenarios' => $scenariosWithSlugs,
        ]);
    }

    #[Route('/story/{slug}/{niveauId?}', name: 'story_show')]
    public function show(string $slug, ?int $niveauId = null): Response
    {
        $scenario = $this->entityManager->getRepository(Scenario::class)->findOneBy(['NomScenario' => str_replace('-', ' ', $slug)]);
    
        if (!$scenario) {
            throw $this->createNotFoundException('Le scénario n\'existe pas');
        }
    
        if ($niveauId === null) {
            $niveau = $scenario->getLesNiveaux()->first();
        } else {
            $niveau = $this->entityManager->getRepository(Niveau::class)->find($niveauId);
        }
    
        if (!$niveau) {
            throw $this->createNotFoundException('Aucun niveau trouvé pour ce scénario');
        }
    
        $choix = $niveau->getLesChoix();
        $personnage = $this->entityManager->getRepository(Personnage::class)->findOneBy([], ['id' => 'DESC']);

    
        // Vérifiez si les caractéristiques existent pour le personnage
        $caracteristiques = $personnage ? $personnage->getAura() : null;
    
        return $this->render('story/show.html.twig', [
            'scenario' => $scenario,
            'niveau' => $niveau,
            'choix' => $choix,
            'personnage' => $personnage,
            'caracteristiques' => $caracteristiques,
        ]);
    }
        
    #[Route('/story/{slug}/{niveauId}/{choixId}', name: 'story_choix')]
    public function choix(string $slug, int $niveauId, int $choixId): Response
    {
        $scenario = $this->entityManager->getRepository(Scenario::class)->findOneBy(['NomScenario' => str_replace('-', ' ', $slug)]);
        $niveau = $this->entityManager->getRepository(Niveau::class)->find($niveauId);
        $choix = $this->entityManager->getRepository(Choix::class)->find($choixId);
        $personnage = $this->entityManager->getRepository(Personnage::class)->findOneBy([], ['id' => 'DESC']);

        if (!$scenario || !$niveau || !$choix) {
            throw $this->createNotFoundException('Le scénario, le niveau ou le choix n\'existe pas');
        }

        // Appliquer les conséquences du choix
        if ($personnage && $personnage->getAura()) {
            $caracteristiques = $personnage->getAura();
            $consequences = $choix->getConsequenceChoix();

            // Appliquer chaque modification de manière ordonnée
            $caracteristiques->setAura($caracteristiques->getAura() + ($consequences[0] ?? 0));
            $caracteristiques->setHumour($caracteristiques->getHumour() + ($consequences[1] ?? 0));
            $caracteristiques->setCharisme($caracteristiques->getCharisme() + ($consequences[2] ?? 0));
            $caracteristiques->setPertinence($caracteristiques->getPertinence() + ($consequences[3] ?? 0));
            $caracteristiques->setIntelligence($caracteristiques->getIntelligence() + ($consequences[4] ?? 0));

            // Sauvegarder les modifications
            $this->entityManager->persist($caracteristiques);
            $this->entityManager->flush();

            // Ajouter un message flash pour afficher le texte du choix
            $this->addFlash('choiceText', $choix->getTextChoix());
        }

        // Si l'Aura est à 0 ou en dessous, rediriger vers une page de défaite
        if ($caracteristiques->getAura() <= 0) {
            return $this->render('story/loss.html.twig', [
                'scenario' => $scenario,
            ]);
        }

        // Déterminer le niveau suivant
        $nextNiveau = $this->entityManager->getRepository(Niveau::class)->find($niveauId + 1);

        if (!$nextNiveau) {
            return $this->render('story/end.html.twig', [
                'scenario' => $scenario,
            ]);
        }

        return $this->redirectToRoute('story_show', [
            'slug' => $slug,
            'niveauId' => $nextNiveau->getId(),
        ]);
    }

    private function slugify(string $text): string
    {
        // Remplace les espaces par des tirets
        $text = str_replace(' ', '-', $text);
        // Supprime les caractères non alphanumériques
        $text = preg_replace('/[^A-Za-z0-9\-]/', '', $text);
        // Convertit en minuscules
        return strtolower($text);
    }
}
