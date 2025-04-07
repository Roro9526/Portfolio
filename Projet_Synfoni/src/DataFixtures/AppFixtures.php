<?php

namespace App\DataFixtures;

use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use App\Entity\Choix;
use App\Entity\Niveau;
use App\Entity\Scenario;
use App\Entity\User;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    private UserPasswordHasherInterface $passwordHasher;

    public function __construct(UserPasswordHasherInterface $passwordHasher)
    {
        $this->passwordHasher = $passwordHasher;
    }

    public function load(ObjectManager $manager): void
    {
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Scénario existant : "Tremper le biscuit"
        $Scenario1 = new Scenario();
        $Scenario1->setNomScenario('Chloe Charmeur');
        $Scenario1->setDescription("Un rendez-vous où tout peut basculer. Elle, une femme élégante et intelligente, passionnée par l'art, les voyages, et les discussions profondes. Sa faiblesse ? Un sens de l'humour audacieux et un charme authentique. Saurez-vous capter son attention et gagner son cœur ?");
        $manager->persist($Scenario1);

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Niveau 1 : L'arrivée au café
        $Niveau1 = new Niveau();
        $Niveau1->setNomNiveau('L\'arrivée épique');
        $Niveau1->setTextNiveau("Vous arrivez au café en retard de 15 minutes. Votre rendez-vous vous fixe avec un sourire... légèrement crispé.");
        $Niveau1->setLeScenario($Scenario1);
        $manager->persist($Niveau1);

        // Choix du Niveau 1
        $Choix1_1 = new Choix();
        $Choix1_1->setNomChoix("Vous dites : « Désolé, j'ai croisé un chat qui ressemblait trop à mon ex, ça m'a troublé. »");
        $Choix1_1->setTextChoix("Elle se vexe, vous jette un verre d'eau et quitte le restaurant en colère.");
        $Choix1_1->setConsequenceChoix(["-10", "+1", "-3", "-1", "+1"]);
        $Choix1_1->setLeNiveau($Niveau1);
        $manager->persist($Choix1_1);

        $Choix1_2 = new Choix();
        $Choix1_2->setNomChoix("Vous arrivez en courant, glissez sur le carrelage, et atterrissez sur les genoux avec une rose entre les dents.");
        $Choix1_2->setTextChoix("Elle éclate de rire, applaudit et semble conquise par votre humour et votre entrée spectaculaire.");
        $Choix1_2->setConsequenceChoix(["+3", "+3", "+2", "0", "-1"]);
        $Choix1_2->setLeNiveau($Niveau1);
        $manager->persist($Choix1_2);

        $Choix1_3 = new Choix();
        $Choix1_3->setNomChoix("Vous offrez un cadeau sans raison, un livre de poésie.");
        $Choix1_3->setTextChoix("Elle est touchée par ce geste inattendu, vos chances de connexion augmentent.");
        $Choix1_3->setConsequenceChoix(["+2", "+4", "+3", "+1", "+2"]);
        $Choix1_3->setLeNiveau($Niveau1);
        $manager->persist($Choix1_3);

        $Choix1_4 = new Choix();
        $Choix1_4->setNomChoix("Vous vous excusez sincèrement pour votre retard et proposez de recommencer la soirée.");
        $Choix1_4->setTextChoix("Elle apprécie votre sincérité et accepte de vous donner une chance.");
        $Choix1_4->setConsequenceChoix(["+1", "+2", "0", "0", "+1"]);
        $Choix1_4->setLeNiveau($Niveau1);
        $manager->persist($Choix1_4);

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////

        // Scénario 2 : Professeur Nathan
        $Scenario2 = new Scenario();
        $Scenario2->setNomScenario('Prof Nathan');
        $Scenario2->setDescription("Vous avez un rendez-vous avec Nathan, un professeur chauve qui aime victimiser ses élèves. Comment allez-vous réagir face à ses remarques sur vos compétences ?");
        $manager->persist($Scenario2);

        // Niveau 1 : L'entrée en classe
        $Niveau1Prof = new Niveau();
        $Niveau1Prof->setNomNiveau('L\'entrée en classe');
        $Niveau1Prof->setTextNiveau("Vous entrez dans la classe où Nathan, le professeur chauve, vous attend déjà avec un sourire moqueur.");
        $Niveau1Prof->setLeScenario($Scenario2);
        $manager->persist($Niveau1Prof);

        // Choix du Niveau 1 Prof
        $Choix1Prof_1 = new Choix();
        $Choix1Prof_1->setNomChoix("Vous dites : « J'espère que vous avez bien dormi, Nathan, vu la quantité de cheveux que vous avez perdus. »");
        $Choix1Prof_1->setTextChoix("Nathan rit, mais semble légèrement vexé par votre remarque.");
        $Choix1Prof_1->setConsequenceChoix(["-2", "+1", "-1", "-3", "+1"]);
        $Choix1Prof_1->setLeNiveau($Niveau1Prof);
        $manager->persist($Choix1Prof_1);

        $Choix1Prof_2 = new Choix();
        $Choix1Prof_2->setNomChoix("Vous faites un compliment sur son look et lui demandez comment il garde son calme avec ses élèves.");
        $Choix1Prof_2->setTextChoix("Nathan sourit, mais semble un peu perturbé par votre curiosité.");
        $Choix1Prof_2->setConsequenceChoix(["+1", "0", "+2", "-1", "+2"]);
        $Choix1Prof_2->setLeNiveau($Niveau1Prof);
        $manager->persist($Choix1Prof_2);

        $Choix1Prof_3 = new Choix();
        $Choix1Prof_3->setNomChoix("Vous le taquinez en lui disant qu'il pourrait trouver une solution pour ses cheveux.");
        $Choix1Prof_3->setTextChoix("Nathan semble plus détendu et vous remercie pour la remarque.");
        $Choix1Prof_3->setConsequenceChoix(["+2", "0", "+1", "-1", "+1"]);
        $Choix1Prof_3->setLeNiveau($Niveau1Prof);
        $manager->persist($Choix1Prof_3);

        $Choix1Prof_4 = new Choix();
        $Choix1Prof_4->setNomChoix("Vous le complimentez pour son savoir et l'interrogez sur son parcours.");
        $Choix1Prof_4->setTextChoix("Nathan vous répond, manifestant un intérêt pour la conversation.");
        $Choix1Prof_4->setConsequenceChoix(["+3", "+1", "+1", "+2", "0"]);
        $Choix1Prof_4->setLeNiveau($Niveau1Prof);
        $manager->persist($Choix1Prof_4);

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////

        // Nouveau scénario : Blanche Fesse et les 7 Mains
        $Scenario3 = new Scenario();
        $Scenario3->setNomScenario('Blanche Fesse et les 7 Mains');
        $Scenario3->setDescription("Blanche Fesse, une aventurière audacieuse, cherche son 8ème nain pour l'accompagner dans ses aventures au fond de la mine. Oserez-vous relever le défi ?");
        $manager->persist($Scenario3);

        // Niveau 1 : L'appel de la mine
        $Niveau1Mine = new Niveau();
        $Niveau1Mine->setNomNiveau('L\'appel de la mine');
        $Niveau1Mine->setTextNiveau("Blanche Fesse se tient devant la porte de la mine, les 7 nains attendant déjà. Vous arrivez en retard, mais elle semble vous observer avec intérêt.");
        $Niveau1Mine->setLeScenario($Scenario3);
        $manager->persist($Niveau1Mine);

        // Choix du Niveau 1 Mine
        $Choix1Mine_1 = new Choix();
        $Choix1Mine_1->setNomChoix("Vous dites : « Désolé, j'ai eu du mal à trouver un nain qui soit aussi motivé que moi. »");
        $Choix1Mine_1->setTextChoix("Blanche Fesse vous regarde d'un air sceptique, mais les nains commencent à murmurer entre eux.");
        $Choix1Mine_1->setConsequenceChoix(["-2", "+1", "-3", "0", "+1"]);
        $Choix1Mine_1->setLeNiveau($Niveau1Mine);
        $manager->persist($Choix1Mine_1);

        $Choix1Mine_2 = new Choix();
        $Choix1Mine_2->setNomChoix("Vous arrivez avec un grand sourire et proposez de partager vos trésors.");
        $Choix1Mine_2->setTextChoix("Blanche Fesse semble amusée et vous invite à rejoindre les nains.");
        $Choix1Mine_2->setConsequenceChoix(["+2", "+3", "+1", "+2", "-1"]);
        $Choix1Mine_2->setLeNiveau($Niveau1Mine);
        $manager->persist($Choix1Mine_2);

        $Choix1Mine_3 = new Choix();
        $Choix1Mine_3->setNomChoix("Vous vous excusez et lui demandez de vous donner une chance de prouver vos compétences.");
        $Choix1Mine_3->setTextChoix("Blanche Fesse semble intriguée par votre persévérance.");
        $Choix1Mine_3->setConsequenceChoix(["+1", "+2", "0", "0", "+1"]);
        $Choix1Mine_3->setLeNiveau($Niveau1Mine);
        $manager->persist($Choix1Mine_3);

        $Choix1Mine_4 = new Choix();
        $Choix1Mine_4->setNomChoix("Vous proposez à Blanche Fesse un défi d'intelligence pour prouver que vous êtes digne.");
        $Choix1Mine_4->setTextChoix("Les nains se regardent étonnés, mais Blanche Fesse sourit.");
        $Choix1Mine_4->setConsequenceChoix(["+2", "+3", "0", "+1", "+1"]);
        $Choix1Mine_4->setLeNiveau($Niveau1Mine);
        $manager->persist($Choix1Mine_4);

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        
        // Niveau 2 : Le dédale de la mine
        $Niveau2Mine = new Niveau();
        $Niveau2Mine->setNomNiveau('Le dédale de la mine');
        $Niveau2Mine->setTextNiveau("Vous et les 7 nains vous êtes maintenant dans le dédale de la mine. Il y a plusieurs chemins possibles.");
        $Niveau2Mine->setLeScenario($Scenario3);
        $manager->persist($Niveau2Mine);

        // Choix du Niveau 2 Mine
        $Choix2Mine_1 = new Choix();
        $Choix2Mine_1->setNomChoix("Vous suivez le sentier qui semble le plus lumineux.");
        $Choix2Mine_1->setTextChoix("Les nains se plaignent de la lumière trop vive, mais vous avancez avec confiance.");
        $Choix2Mine_1->setConsequenceChoix(["+2", "+2", "+1", "0", "+2"]);
        $Choix2Mine_1->setLeNiveau($Niveau2Mine);
        $manager->persist($Choix2Mine_1);

        $Choix2Mine_2 = new Choix();
        $Choix2Mine_2->setNomChoix("Vous proposez aux nains de prendre un raccourci risqué.");
        $Choix2Mine_2->setTextChoix("Certains nains hésitent, mais Blanche Fesse accepte votre audace.");
        $Choix2Mine_2->setConsequenceChoix(["+3", "+1", "+2", "-2", "+1"]);
        $Choix2Mine_2->setLeNiveau($Niveau2Mine);
        $manager->persist($Choix2Mine_2);

        $Choix2Mine_3 = new Choix();
        $Choix2Mine_3->setNomChoix("Vous décidez d'explorer un chemin étroit et sombre.");
        $Choix2Mine_3->setTextChoix("Blanche Fesse vous suit, impressionnée par votre courage.");
        $Choix2Mine_3->setConsequenceChoix(["+2", "+3", "-1", "0", "+1"]);
        $Choix2Mine_3->setLeNiveau($Niveau2Mine);
        $manager->persist($Choix2Mine_3);

        $Choix2Mine_4 = new Choix();
        $Choix2Mine_4->setNomChoix("Vous demandez à un nain de vous aider à résoudre un casse-tête.");
        $Choix2Mine_4->setTextChoix("Les nains vous aident avec enthousiasme.");
        $Choix2Mine_4->setConsequenceChoix(["+1", "+2", "+3", "0", "+2"]);
        $Choix2Mine_4->setLeNiveau($Niveau2Mine);
        $manager->persist($Choix2Mine_4);

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////

        // Niveau 3 : L'ultime épreuve
        $Niveau3Mine = new Niveau();
        $Niveau3Mine->setNomNiveau('L\'ultime épreuve');
        $Niveau3Mine->setTextNiveau("Vous avez réussi à traverser la mine, mais maintenant se dresse devant vous la porte de l'ultime épreuve. Blanche Fesse et les nains vous observent.");
        $Niveau3Mine->setLeScenario($Scenario3);
        $manager->persist($Niveau3Mine);

        // Choix du Niveau 3 Mine
        $Choix3Mine_1 = new Choix();
        $Choix3Mine_1->setNomChoix("Vous vous lancez dans un défi physique avec les nains.");
        $Choix3Mine_1->setTextChoix("Les nains vous aident, et vous traversez la porte avec aisance.");
        $Choix3Mine_1->setConsequenceChoix(["+3", "+1", "0", "+2", "+1"]);
        $Choix3Mine_1->setLeNiveau($Niveau3Mine);
        $manager->persist($Choix3Mine_1);

        $Choix3Mine_2 = new Choix();
        $Choix3Mine_2->setNomChoix("Vous tentez une approche intellectuelle pour résoudre le dernier mystère.");
        $Choix3Mine_2->setTextChoix("Blanche Fesse vous regarde avec admiration, impressionnée par votre esprit.");
        $Choix3Mine_2->setConsequenceChoix(["+2", "+3", "+1", "+1", "+1"]);
        $Choix3Mine_2->setLeNiveau($Niveau3Mine);
        $manager->persist($Choix3Mine_2);

        $Choix3Mine_3 = new Choix();
        $Choix3Mine_3->setNomChoix("Vous choisissez de charmer Blanche Fesse pour qu'elle vous laisse passer.");
        $Choix3Mine_3->setTextChoix("Blanche Fesse, amusée, vous permet de franchir la porte sans difficulté.");
        $Choix3Mine_3->setConsequenceChoix(["+3", "+2", "0", "-1", "+2"]);
        $Choix3Mine_3->setLeNiveau($Niveau3Mine);
        $manager->persist($Choix3Mine_3);

        $Choix3Mine_4 = new Choix();
        $Choix3Mine_4->setNomChoix("Vous décidez de prendre un autre chemin secret découvert dans la mine.");
        $Choix3Mine_4->setTextChoix("Vous surprenez tout le monde en empruntant un passage secret qui mène directement à la sortie.");
        $Choix3Mine_4->setConsequenceChoix(["+2", "+2", "+3", "0", "+3"]);
        $Choix3Mine_4->setLeNiveau($Niveau3Mine);
        $manager->persist($Choix3Mine_4);

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////

        // Création des utilisateurs
        $user1 = new User();
        $user1->setUsername('AdminChauve');
        $hashedPassword = $this->passwordHasher->hashPassword($user1, 'Nathan');
        $user1->setPassword($hashedPassword);
        $user1->setRoles(['ROLE_ADMIN']);
        $manager->persist($user1);

        $user2 = new User();
        $user2->setUsername('UserPauvreEnCheveau');
        $hashedPassword = $this->passwordHasher->hashPassword($user2, 'ToujoursNathan');
        $user2->setPassword($hashedPassword);
        $user2->setRoles(['ROLE_USER']);
        $manager->persist($user2);

        $manager->flush();
    }
}
