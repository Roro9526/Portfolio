# Scripts utilitaires

Ce dossier contient les scripts utilitaires pour la gestion des données.

## Scripts disponibles

### `generate_names_final.py`
**Description**: Génère le fichier `DB_concession_names.csv` à partir de la base de données.

**Usage**:
```bash
python scripts/generate_names_final.py
```

**Fonction**: 
- Lit les données depuis les tables `sso` et `idocs_con`
- Agrège les noms par concession
- Préfixe les noms avec leur source (WELCOME: ou IDOCS:)
- Export vers `DB_concession_names.csv`

**Quand l'utiliser**: 
- Après une mise à jour de la base de données
- Pour régénérer les noms de concessions

---

### `generate_csv_from_db.py`
**Description**: Exporte les noms de concessions depuis la table `con_nom` vers CSV.

**Usage**:
```bash
python scripts/generate_csv_from_db.py
```

**Fonction**:
- Lit la table `con_nom` de PostgreSQL
- Export vers CSV

**Quand l'utiliser**:
- Pour exporter les données de la table `con_nom`
- Pour backup des noms de concessions

---

## Notes

- Ces scripts sont indépendants de l'application principale (`app.py`)
- Ils utilisent la même configuration de base de données
- Exécutez-les depuis la racine du projet
