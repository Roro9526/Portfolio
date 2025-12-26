# DealerView - Documentation Technique

## 📋 Présentation du Projet

DealerView est une application web Flask qui permet de comparer les utilisateurs entre deux systèmes :
- **SSO/Welcome** : Le système de Single Sign-On Iveco Welcome
- **IDOCS** : Le système de gestion documentaire Iveco

L'objectif est d'identifier les correspondances et différences entre ces deux bases de données utilisateurs, organisées par concessions (dealers).

---

## 🏗️ Architecture du Projet

```
test_py/
├── app.py                    # Application Flask principale (routes)
├── utils/                    # Modules utilitaires
│   ├── __init__.py          # Exports du module
│   ├── database.py          # Connexion base de données MySQL
│   ├── formatters.py        # Formatage HTML des tableaux
│   └── parsers.py           # Parsing et normalisation des données
├── templates/                # Templates HTML Jinja2
│   ├── home.html            # Page d'accueil (liste des concessions)
│   ├── dealers.html         # Page détail d'une concession
│   ├── compare.html         # Page comparaison concession
│   ├── compare_user.html    # Page détail d'un utilisateur
│   ├── home_user.html       # Liste des utilisateurs
│   └── search_user.html     # Recherche par IWU ID
├── scripts/                  # Scripts d'import/maintenance
├── backup_mysql_*/          # Dossiers de backup
└── requirements.txt          # Dépendances Python
```

---

## 🔧 Comment ça marche : Flask

### Qu'est-ce que Flask ?
Flask est un **micro-framework web Python**. Il permet de créer des sites web dynamiques en associant des **URLs** (routes) à des **fonctions Python**.

### Le principe de base

```python
from flask import Flask
app = Flask(__name__)

@app.route('/')           # URL: http://localhost:5000/
def home():
    return "Hello World"  # Ce qui s'affiche

if __name__ == '__main__':
    app.run(debug=True)   # Lance le serveur sur le port 5000
```

Quand tu visites `http://localhost:5000/`, Flask appelle la fonction `home()` et affiche le résultat.

---

## 📄 Les Routes de l'Application

### 1. Page d'Accueil `/` (home.html)

```python
@app.route('/', methods=['GET'])
def home():
```

**Ce qu'elle fait :**
- Récupère toutes les concessions depuis `sso` et `idocs_user`
- Compte les utilisateurs par concession
- Affiche deux colonnes : Welcome (SSO) et IDOCS
- Les lignes vertes = concessions présentes dans les deux systèmes

**Requêtes SQL exécutées :**
```sql
SELECT DISTINCT sap_princ FROM sso WHERE sap_princ IS NOT NULL
SELECT DISTINCT sap_princ FROM idocs_user WHERE sap_princ IS NOT NULL
SELECT sap_princ, sap_nom FROM con_nom WHERE sap_princ IS NOT NULL
```

---

### 2. Page Détail Concession `/dealers/<sap_princ>` (dealers.html)

```python
@app.route('/dealers/<sap_princ>', methods=['GET'])
def dealers(sap_princ):
```

**Ce qu'elle fait :**
- Affiche tous les utilisateurs d'une concession spécifique
- Compare les utilisateurs SSO vs IDOCS
- Colorie en vert les utilisateurs présents dans les deux systèmes

**Paramètre URL :** `sap_princ` = Code SAP de la concession (ex: `/dealers/12137`)

---

### 3. Page Comparaison `/compare` (compare.html)

```python
@app.route('/compare', methods=['GET', 'POST'])
def compare():
```

**Ce qu'elle fait :**
- Similaire à `/dealers` mais avec un formulaire de sélection
- Permet de changer de concession via un dropdown

---

### 4. Page Détail Utilisateur `/compare_user` (compare_user.html)

```python
@app.route('/compare_user', methods=['GET'])
def compare_user():
```

**Ce qu'elle fait :**
- Affiche le détail d'un utilisateur spécifique
- Compare ses infos entre SSO et IDOCS :
  - Identité (nom, prénom)
  - IWU ID (Iveco Welcome User ID)
  - Concessions rattachées
  - Métier (marque, type profil)

**Paramètres URL :** `?id=XXX&sap=YYY`

---

### 5. Page Recherche `/search_user` (search_user.html)

```python
@app.route('/search_user', methods=['GET', 'POST'])
def search_user():
```

**Ce qu'elle fait :**
- Recherche un utilisateur par son IWU ID
- Affiche tous les utilisateurs correspondants

---

## 🗃️ Base de Données

### Configuration (utils/database.py)

```python
import pymysql

DB_HOST = "10.33.99.59"
DB_PORT = 3307
DB_NAME = "preanalyse-dv"
DB_USER = "preanalyse-dv"
DB_PASS = "TuMnWosbYJvRGVWbb5graFfi"

def get_conn():
    return pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )
```

### Tables Principales

| Table | Description |
|-------|-------------|
| `sso` | Utilisateurs du système Welcome (id_cree, nom, prenom, sap_princ) |
| `idocs_user` | Utilisateurs IDOCS (id_cree, nom, prenom, sap_princ) |
| `sso_user_detail` | Détails utilisateurs SSO (iwu_id, etc.) |
| `idocs_user_detail` | Détails utilisateurs IDOCS (iwu_id, marque, typeprofil) |
| `con_nom` | Noms des concessions (sap_princ, sap_nom) |
| `idocs_con` | Concessions IDOCS (sap_dealer, sap_princ, sap_nom) |

---

## 🎨 Templates HTML (Jinja2)

Flask utilise **Jinja2** pour générer du HTML dynamique.

### Syntaxe Jinja2

```html
<!-- Variable -->
{{ variable }}

<!-- Boucle -->
{% for item in liste %}
    <p>{{ item }}</p>
{% endfor %}

<!-- Condition -->
{% if condition %}
    <p>Vrai</p>
{% else %}
    <p>Faux</p>
{% endif %}
```

### Exemple dans home.html

```html
{% for dealer in sso_dealers %}
    <tr class="{% if dealer.in_both %}both{% endif %}">
        <td>{{ dealer.sap_princ }}</td>
        <td>{{ dealer.names_info.display_name }}</td>
        <td>{{ dealer.count_users }}</td>
    </tr>
{% endfor %}
```

---

## 🔧 Modules Utilitaires

### utils/parsers.py

**`normalize_id(s)`** : Normalise les identifiants
- Supprime les accents
- Garde uniquement les lettres
- Met en majuscules
- Permet de comparer "Müller" avec "MULLER"

**`parse_multiple_names(string, source)`** : Parse les noms de concession
- Input: `"IDOCS: ABC; WELCOME: XYZ"`
- Output pour source="WELCOME": `['XYZ']`

### utils/formatters.py

**`format_iwu_column(iwu_str)`** : Formate les IWU IDs
- Si 1 ID → affiche l'ID
- Si plusieurs → affiche un badge "3 Iveco ID" avec tooltip

**`df_to_html(df, sap)`** : Convertit un DataFrame pandas en tableau HTML
- Ajoute les classes CSS (vert pour "both")
- Ajoute les événements onclick pour navigation

---

## 🔄 Flux de Données

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   MySQL     │────▶│   Pandas    │────▶│   Flask     │
│  (données)  │     │ (DataFrame) │     │  (routes)   │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
                                        ┌─────────────┐
                                        │   Jinja2    │
                                        │ (templates) │
                                        └─────────────┘
                                              │
                                              ▼
                                        ┌─────────────┐
                                        │   HTML      │
                                        │ (navigateur)│
                                        └─────────────┘
```

1. **MySQL** → Stocke toutes les données utilisateurs/concessions
2. **Pandas** → Lit les données SQL avec `pd.read_sql()` et les manipule
3. **Flask** → Reçoit les requêtes HTTP et appelle les bonnes fonctions
4. **Jinja2** → Génère le HTML final avec les données
5. **Navigateur** → Affiche la page au client

---

## 🚀 Lancer l'Application

```bash
# 1. Installer les dépendances
pip install -r requirements.txt

# 2. Lancer le serveur
python app.py

# 3. Ouvrir dans le navigateur
# http://localhost:5000/
```

---

## 📝 Commandes Utiles

```bash
# Voir les logs en temps réel
python app.py

# Mode debug (rechargement auto)
# Déjà activé avec debug=True dans app.py

# Tester la connexion DB
python -c "from utils.database import get_conn; conn = get_conn(); print('OK'); conn.close()"
```

---

## 🔒 Sécurité

⚠️ **Attention** : Les identifiants de base de données sont en clair dans `database.py`.
Pour la production, utilise des variables d'environnement :

```python
import os
DB_PASS = os.environ.get('DB_PASSWORD')
```

---

## 📚 Technologies Utilisées

| Technologie | Rôle |
|-------------|------|
| **Python 3.12** | Langage de programmation |
| **Flask** | Framework web |
| **Jinja2** | Moteur de templates HTML |
| **Pandas** | Manipulation de données |
| **PyMySQL** | Connecteur MySQL |
| **MySQL 8** | Base de données |
| **HTML/CSS/JS** | Interface utilisateur |
| **Bootstrap** | Framework CSS |

---

## 🆘 Dépannage

### Erreur de connexion MySQL
```
pymysql.err.OperationalError: Can't connect to MySQL server
```
→ Vérifier que le serveur MySQL est accessible (firewall, VPN)

### Aucune donnée affichée
→ Vérifier que les tables contiennent des données
```python
python -c "from utils.database import get_conn; import pandas as pd; conn = get_conn(); print(pd.read_sql('SELECT COUNT(*) FROM sso', conn))"
```

### Caractères \r dans les données
→ Le script `backup_and_clean.py` nettoie ces caractères
