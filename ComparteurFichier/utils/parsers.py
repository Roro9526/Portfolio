"""
Fonctions de parsing et normalisation de données
"""

import unicodedata
import re
import pandas as pd


def normalize_id(s):
    """
    Normalise un identifiant en retirant les accents et caractères spéciaux.
    
    Args:
        s: Chaîne à normaliser
        
    Returns:
        str: Chaîne normalisée en majuscules, sans accents ni caractères spéciaux
    """
    if s is None:
        return ""
    s = str(s)
    s = ''.join(c for c in unicodedata.normalize('NFD', s)
                if unicodedata.category(c) != 'Mn')
    s = re.sub(r'[^A-Za-z]', '', s)
    return s.upper()


def parse_multiple_names(sap_nom_string, source="WELCOME"):
    """
    Parse une chaîne de noms provenant de con_nom et filtre par source.
    
    Format attendu: "IDOCS: SPL SECLIN; WELCOME: SPL HAUT DE FRANCE; WELCOME: SPL LITTORAL"
    
    Args:
        sap_nom_string (str): Chaîne contenant les noms avec leurs sources
        source (str): Source à filtrer ("WELCOME" ou "IDOCS")
    
    Returns:
        list: Liste de noms filtrés pour la source demandée
        
    Example:
        >>> parse_multiple_names("WELCOME: ABC; IDOCS: XYZ", "WELCOME")
        ['ABC']
    """
    if not sap_nom_string or pd.isna(sap_nom_string):
        return []
    
    names = [n.strip() for n in str(sap_nom_string).split(';')]
    clean_names = []
    
    for name in names:
        if ':' in name:
            prefix, content = name.split(':', 1)
            prefix = prefix.strip().upper()
            content = content.strip()
            
            if source == "WELCOME" and prefix == "WELCOME":
                if content:
                    clean_names.append(content)
            elif source == "IDOCS" and prefix == "IDOCS":
                if content:
                    clean_names.append(content)
    
    return clean_names
