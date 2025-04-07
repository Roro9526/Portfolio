<?php

namespace App\Controller\Admin;

use App\Entity\Choix;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ArrayField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextEditorField;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;

class ChoixCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return Choix::class;
    }

    public function configureFields(string $pageName): iterable
    {
        return [
            IdField::new('id')->hideOnForm(),
            TextField::new('NomChoix'),
            TextEditorField::new('TextChoix'),
            ArrayField::new('ConsequenceChoix'),
            AssociationField::new('LeNiveau')->setCrudController(NiveauCrudController::class),
        ];
    }
}
