"""Script pour backup et nettoyage des données MySQL"""
import pymysql
import pandas as pd
import os
from datetime import datetime

# Connexion directe
conn = pymysql.connect(
    host="10.33.99.59",
    port=3307,
    database="preanalyse-dv",
    user="preanalyse-dv",
    password="TuMnWosbYJvRGVWbb5graFfi"
)

# Creer dossier backup
backup_dir = f"backup_mysql_{datetime.now().strftime('%Y%m%d_%H%M')}"
os.makedirs(backup_dir, exist_ok=True)
print(f"=== Creation backup dans {backup_dir} ===\n")

# Liste des tables a sauvegarder
tables = ['sso', 'idocs_user', 'sso_user_detail', 'idocs_user_detail', 'con_nom', 'idocs_con']

for table in tables:
    try:
        df = pd.read_sql(f"SELECT * FROM {table}", conn)
        filepath = os.path.join(backup_dir, f"{table}.csv")
        df.to_csv(filepath, index=False, encoding='utf-8')
        print(f"[OK] {table}: {len(df)} lignes sauvegardees")
    except Exception as e:
        print(f"[ERR] {table}: Erreur - {e}")

print(f"\n=== Backup termine dans {backup_dir} ===")

# Maintenant nettoyer les \r
print("\n=== Nettoyage des \\r dans les donnees ===\n")

cursor = conn.cursor()

# Liste des colonnes texte a nettoyer pour chaque table
clean_queries = [
    # Table sso
    "UPDATE sso SET id_cree = REPLACE(id_cree, '\r', '') WHERE id_cree LIKE '%\r%'",
    "UPDATE sso SET nom = REPLACE(nom, '\r', '') WHERE nom LIKE '%\r%'",
    "UPDATE sso SET prenom = REPLACE(prenom, '\r', '') WHERE prenom LIKE '%\r%'",
    "UPDATE sso SET sap_princ = REPLACE(sap_princ, '\r', '') WHERE sap_princ LIKE '%\r%'",
    
    # Table idocs_user
    "UPDATE idocs_user SET id_cree = REPLACE(id_cree, '\r', '') WHERE id_cree LIKE '%\r%'",
    "UPDATE idocs_user SET nom = REPLACE(nom, '\r', '') WHERE nom LIKE '%\r%'",
    "UPDATE idocs_user SET prenom = REPLACE(prenom, '\r', '') WHERE prenom LIKE '%\r%'",
    "UPDATE idocs_user SET sap_princ = REPLACE(sap_princ, '\r', '') WHERE sap_princ LIKE '%\r%'",
    
    # Table sso_user_detail
    "UPDATE sso_user_detail SET id_cree = REPLACE(id_cree, '\r', '') WHERE id_cree LIKE '%\r%'",
    "UPDATE sso_user_detail SET nom = REPLACE(nom, '\r', '') WHERE nom LIKE '%\r%'",
    "UPDATE sso_user_detail SET prenom = REPLACE(prenom, '\r', '') WHERE prenom LIKE '%\r%'",
    "UPDATE sso_user_detail SET iwu_id = REPLACE(iwu_id, '\r', '') WHERE iwu_id LIKE '%\r%'",
    
    # Table idocs_user_detail
    "UPDATE idocs_user_detail SET id_cree = REPLACE(id_cree, '\r', '') WHERE id_cree LIKE '%\r%'",
    "UPDATE idocs_user_detail SET nom = REPLACE(nom, '\r', '') WHERE nom LIKE '%\r%'",
    "UPDATE idocs_user_detail SET prenom = REPLACE(prenom, '\r', '') WHERE prenom LIKE '%\r%'",
    "UPDATE idocs_user_detail SET iwu_id = REPLACE(iwu_id, '\r', '') WHERE iwu_id LIKE '%\r%'",
    
    # Table con_nom
    "UPDATE con_nom SET sap_princ = REPLACE(sap_princ, '\r', '') WHERE sap_princ LIKE '%\r%'",
    "UPDATE con_nom SET sap_nom = REPLACE(sap_nom, '\r', '') WHERE sap_nom LIKE '%\r%'",
    
    # Table idocs_con
    "UPDATE idocs_con SET sap_princ = REPLACE(sap_princ, '\r', '') WHERE sap_princ LIKE '%\r%'",
    "UPDATE idocs_con SET sap_dealer = REPLACE(sap_dealer, '\r', '') WHERE sap_dealer LIKE '%\r%'",
    "UPDATE idocs_con SET sap_nom = REPLACE(sap_nom, '\r', '') WHERE sap_nom LIKE '%\r%'",
]

for query in clean_queries:
    try:
        cursor.execute(query)
        affected = cursor.rowcount
        if affected > 0:
            table_name = query.split()[1]
            col_name = query.split()[3]
            print(f"[OK] {table_name}.{col_name}: {affected} lignes nettoyees")
    except Exception as e:
        print(f"[ERR] Erreur: {e}")

conn.commit()
print("\n=== Nettoyage termine et commite ===")

# Verification
print("\n=== Verification ===")
cursor.execute("SELECT id_cree FROM idocs_user WHERE sap_princ = '12137' LIMIT 3")
results = cursor.fetchall()
print(f"Recherche '12137' (sans \\r): {len(results)} resultats trouves")
if results:
    print("Exemples:", [r[0] for r in results[:3]])

conn.close()
print("\n[OK] Termine!")
