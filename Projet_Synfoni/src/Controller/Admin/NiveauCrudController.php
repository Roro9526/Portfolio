<?php

namespace App\Controller\Admin;

use App\Entity\Niveau;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ArrayField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextEditorField;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;

class NiveauCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return Niveau::class;
    }

    public function configureFields(string $pageName): iterable
    {
        return [
            IdField::new('id')->hideOnForm(),
            TextField::new('NomNiveau'),
            TextField::new('TextNiveau'),
            AssociationField::new('LeScenario')->setCrudController(ScenarioCrudController::class),
            AssociationField::new('LesChoix')->setCrudController(ChoixCrudController::class),
        ];
    }
}
