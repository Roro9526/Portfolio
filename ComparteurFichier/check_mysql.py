"""Script pour vérifier les caractères dans sap_princ"""
from utils.database import get_conn
import pandas as pd
import pymysql

# Connexion DIRECTE sans wrapper pour voir les données brutes
conn = pymysql.connect(
    host="10.33.99.59",
    port=3307,
    database="preanalyse-dv",
    user="preanalyse-dv",
    password="TuMnWosbYJvRGVWbb5graFfi"
)

cursor = conn.cursor()

cursor.execute("SELECT DISTINCT sap_princ FROM idocs_user WHERE sap_princ IS NOT NULL AND sap_princ != '' LIMIT 5")
rows = cursor.fetchall()

print("=== Données brutes (sans nettoyage) ===")
for row in rows:
    val = row[0]
    print(f"Value: {repr(val)}")

# Maintenant tester la recherche
cursor.execute("SELECT id_cree FROM idocs_user WHERE sap_princ = '12137'")
result = cursor.fetchall()
print(f"\n=== Recherche '12137': {len(result)} résultats ===")

# Tester avec le \r
cursor.execute("SELECT id_cree FROM idocs_user WHERE sap_princ = '12137\r'")
result2 = cursor.fetchall()
print(f"=== Recherche '12137\\r': {len(result2)} résultats ===")

conn.close()
