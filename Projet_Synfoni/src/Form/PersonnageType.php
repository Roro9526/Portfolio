<?php

namespace App\Form;

use App\Entity\Personnage;
use App\Entity\Caracteristique;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\IntegerType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Validator\Constraints as Assert;

class PersonnageType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('NomPersonnage', TextType::class, [
                'label' => 'Nom du Personnage',
                'constraints' => [
                    new Assert\NotBlank(),
                ],
            ])
            ->add('Aura', IntegerType::class, [
                'label' => 'Aura',
                'disabled' => true, // Désactive le champ pour qu'il ne puisse pas être modifié
                'data' => 10, // Définit la valeur par défaut à 10
            ])
            ->add('Humour', IntegerType::class, [
                'label' => 'Humour',
                'mapped' => false, // Champ temporaire non lié directement à l'entité
                'constraints' => [
                    new Assert\NotBlank(),
                    new Assert\Range(['min' => 0, 'max' => 5]),
                ],
            ])
            ->add('Charisme', IntegerType::class, [
                'label' => 'Charisme',
                'mapped' => false,
                'constraints' => [
                    new Assert\NotBlank(),
                    new Assert\Range(['min' => 0, 'max' => 5]),
                ],
            ])
            ->add('Pertinence', IntegerType::class, [
                'label' => 'Pertinence',
                'mapped' => false,
                'constraints' => [
                    new Assert\NotBlank(),
                    new Assert\Range(['min' => 0, 'max' => 5]),
                ],
            ])
            ->add('Intelligence', IntegerType::class, [
                'label' => 'Intelligence',
                'mapped' => false,
                'constraints' => [
                    new Assert\NotBlank(),
                    new Assert\Range(['min' => 0, 'max' => 5]),
                ],
            ]);
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => Personnage::class,
        ]);
    }
}
