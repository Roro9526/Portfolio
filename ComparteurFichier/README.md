# DealerView 🚗

Application Flask pour visualiser et comparer les données des concessionnaires entre les systèmes Welcome et IDOCS.

## 📋 Description

DealerView permet de :
- Visualiser la liste des concessions avec leurs utilisateurs
- Comparer les données entre Welcome et IDOCS
- Analyser les écarts entre les deux systèmes
- Rechercher des utilisateurs par IWU ID
- Voir les détails des concessions et leur source (Welcome/IDOCS)

## 🏗️ Structure du projet

```
test_py/
├── app.py                  # Application Flask (routes)
├── DB_concession_names.csv # Données concessions
├── utils/                  # Modules utilitaires
│   ├── __init__.py         # Exports du module
│   ├── database.py         # Connexion PostgreSQL
│   ├── parsers.py          # Parsing et normalisation
│   └── formatters.py       # Formatage HTML
├── scripts/                # Scripts utilitaires
│   ├── generate_names_final.py     # Génération CSV noms
│   └── generate_csv_from_db.py     # Export depuis DB
├── templates/              # Templates Jinja2
│   ├── compare.html
│   ├── compare_user.html
│   ├── dealers.html
│   ├── home.html
│   ├── home_user.html
│   └── search_user.html
└── README.md
```


## 🚀 Installation

### Prérequis
- Python 3.8+
- PostgreSQL

### Étapes

1. **Installer les dépendances**
```bash
pip install flask psycopg2 pandas
```

2. **Configuration de la base de données**

Modifier les paramètres dans `utils/database.py` :
```python
DB_HOST = "localhost"
DB_NAME = "dealerview"
DB_USER = "postgres"
DB_PASS = "votre_mot_de_passe"
```

3. **Lancer l'application**
```bash
python app.py
```

L'application sera accessible sur http://localhost:5000

## 📱 Pages disponibles

- **`/`** : Page d'accueil avec liste des concessions
- **`/dealers/<sap_princ>`** : Détails d'une concession
- **`/compare?sap_dealer=<code>`** : Comparaison Welcome/IDOCS
- **`/compare_user?id=<id>&sap=<code>`** : Détails d'un utilisateur
- **`/search_user`** : Recherche par IWU ID

## 🎨 Fonctionnalités

### Affichage des concessions
- Liste triable et filtrable
- Compteurs d'utilisateurs Welcome/IDOCS
- Badges de source (W/I/W+I)
- Recherche par nom ou code SAP

### Comparaison des données
- Visualisation côte à côte Welcome vs IDOCS
- Surlignage des correspondances
- Badges pour IWU IDs multiples
- Tooltips informatifs

### Détails des concessions
- Noms trouvés par source (compact)
- Liste des utilisateurs par sous-concession
- Filtrage dynamique
- Badges de source

## 🛠️ Modules utilitaires

### `utils/database.py`
Gestion de la connexion PostgreSQL
```python
from utils import get_conn
conn = get_conn()
```

### `utils/parsers.py`
Parsing et normalisation des données
```python
from utils import normalize_id, parse_multiple_names

# Normaliser un ID
normalized = normalize_id("René-Lefèvre")  # → "RENELEFEVRE"

# Parser les noms multiples
names = parse_multiple_names("WELCOME: ABC; IDOCS: XYZ", "WELCOME")  # → ['ABC']
```

### `utils/formatters.py`
Formatage HTML
```python
from utils import format_iwu_column, df_to_html

# Formater IWU IDs
html = format_iwu_column("123;456;789")  # → HTML avec badge +3

# Convertir DataFrame en tableau HTML
table = df_to_html(df, sap="12469")
```

## 📊 Base de données

### Tables utilisées
- `sso` : Données Welcome
- `sso_user_detail` : Détails utilisateurs Welcome
- `idocs_user` : Données IDOCS
- `idocs_user_detail` : Détails utilisateurs IDOCS
- `idocs_con` : Concessions IDOCS
- `con_nom` : Noms des concessions (sources multiples)

## 🔄 Changelog

### Version 5.0 (2025-12-03)
- 🎉 Restructuration majeure du code
- 📦 Création des modules utils/
- 📉 Réduction de 20% du code (784 → 628 lignes)
- ✨ Code modulaire et réutilisable

### Version 4.0 (2025-12-03)
- 🏷️ Badges de source dans la sidebar
- 📝 Info concession compacte
- 🎨 Amélioration UI

### Version 3.0 (2025-12-03)
- 🔵 Badge bleu pour IWU IDs multiples
- 👤 Affichage "Nom Prénom" au lieu de "id_cree"
- ℹ️ Info concession principale sur page dealers

## 👨‍💻 Développement

### Tests
```bash
# Tester l'import
python -c "from app import app; print('OK')"

# Lancer l'app en mode debug
python app.py
```

### Ajouter une fonction utilitaire
1. Créer la fonction dans le module approprié (`utils/parsers.py`, `utils/formatters.py`, etc.)
2. L'exporter dans `utils/__init__.py`
3. L'importer dans `app.py` : `from utils import ma_fonction`

## 📝 Documentation

- **MODIFICATIONS.txt** : Historique complet des modifications
- **RESTRUCTURATION_COMPLETE.md** : Détails de la restructuration

## 🔒 Backups

Les backups sont créés avant chaque modification majeure :
- `backup_20251203_084158/` : Avant première série de modifications
- `backup_before_refactor_20251203_093924/` : Avant restructuration

## 📧 Support

Pour toute question ou problème, consulter la documentation dans `MODIFICATIONS.txt` et `RESTRUCTURATION_COMPLETE.md`.

---

**Dernière mise à jour** : 03/12/2025  
**Version** : 5.0  
**Python** : 3.8+  
**Framework** : Flask
