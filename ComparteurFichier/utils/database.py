"""
Gestion de la connexion à la base de données MySQL
"""

import pymysql

# Configuration de la base de données
DB_HOST = "10.33.99.59"
DB_PORT = 3307
DB_NAME = "preanalyse-dv"
DB_USER = "preanalyse-dv"
DB_PASS = "TuMnWosbYJvRGVWbb5graFfi"


def get_conn():
    """
    Crée et retourne une connexion à la base de données MySQL.
    
    Returns:
        pymysql.Connection: Connexion à la base de données
    """
    return pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )

