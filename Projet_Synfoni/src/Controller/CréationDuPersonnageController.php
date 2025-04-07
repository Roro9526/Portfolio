<?php

namespace App\Controller;

use App\Entity\Personnage;
use App\Entity\Caracteristique;
use App\Form\PersonnageType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class CréationDuPersonnageController extends AbstractController
{
    #[Route('/creation-du-personnage', name: 'creation_personnage')]
    public function creation(Request $request, EntityManagerInterface $em): Response
    {
        $personnage = new Personnage();
        $form = $this->createForm(PersonnageType::class, $personnage);

        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            // Récupérer les valeurs des champs non mappés
            $humour = $form->get('Humour')->getData();
            $charisme = $form->get('Charisme')->getData();
            $pertinence = $form->get('Pertinence')->getData();
            $intelligence = $form->get('Intelligence')->getData();

            // Vérifier que la somme est égale à 5
            if (($humour + $charisme + $pertinence + $intelligence) !== 5) {
                $this->addFlash('error', 'La somme de Humour, Charisme, Pertinence et Intelligence doit être égale à 5.');

                return $this->render('création_du_personnage/index.html.twig', [
                    'form' => $form->createView(),
                ]);
            }

            // Créer et lier la caractéristique
            $caracteristique = new Caracteristique();
            $caracteristique->setAura(10); // Aura par défaut
            $caracteristique->setHumour($humour);
            $caracteristique->setCharisme($charisme);
            $caracteristique->setPertinence($pertinence);
            $caracteristique->setIntelligence($intelligence);

            $personnage->setAura($caracteristique);

            // Sauvegarder les entités
            $em->persist($caracteristique);
            $em->persist($personnage);
            $em->flush();

            return $this->redirectToRoute('story');
        }

        return $this->render('création_du_personnage/index.html.twig', [
            'form' => $form->createView(),
        ]);
    }
}
