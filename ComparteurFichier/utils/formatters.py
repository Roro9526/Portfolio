"""
Fonctions de formatage HTML pour l'affichage des données
"""


def format_iwu_column(iwu_str):
    """
    Formate la colonne IWU_ID pour affichage dans les tableaux.
    
    Args:
        iwu_str (str): Chaîne contenant un ou plusieurs IWU IDs séparés par ';'
        
    Returns:
        str: HTML formaté (badge avec tooltip si plusieurs IDs, sinon ID simple)
        
    Example:
        >>> format_iwu_column("123")
        '123'
        >>> format_iwu_column("123;456;789")
        '<span class="iwu-badge-container">3 Iveco ID <span class="iwu-count-badge">+3</span>...</span>'
    """
    if not iwu_str or iwu_str == "NONE":
        return ""
    
    ids = [x for x in iwu_str.split(';') if x and x != "NONE"]
    count = len(ids)
    
    if count == 0:
        return ""
    elif count == 1:
        return ids[0]
    else:
        # Badge avec tooltip CSS moderne
        ids_list = "<br>".join(ids)
        badge_html = f'''
            <span class="iwu-badge-container">
                {count} Iveco ID 
                <span class="iwu-count-badge">+{count}</span>
                <span class="iwu-tooltip">{ids_list}</span>
            </span>
        '''
        return badge_html.strip()


def df_to_html(df, sap=None, return_url=None):
    """
    Convertit un DataFrame en tableau HTML formaté pour affichage.
    
    Cette fonction gère deux contextes :
    - Page /compare : affichage simple avec sap dealer
    - Page /dealers : affichage avec data-dealer et return_url
    
    Args:
        df (pd.DataFrame): DataFrame contenant les colonnes id_cree, nom, prenom, iwu_id, status
        sap (str, optional): Code SAP dealer pour les liens
        return_url (str, optional): URL de retour (utilisé pour /dealers)
        
    Returns:
        str: Tableau HTML complet
    """
    rows = []
    display_cols = ["Nom Prénom", "iwu_id"]

    header = "<tr>" + "".join(f"<th>{c}</th>" for c in display_cols) + "</tr>"
    rows.append(header)

    for _, row in df.iterrows():
        css = row["status"]
        iwu_val = format_iwu_column(row["iwu_id"])
        nom_prenom = f"{row['nom']} {row['prenom']}"
        
        # Vérifier si les dealers correspondent
        dealer_match = row.get("dealer_match", True)
        
        # Déterminer le dealer code et construire l'onclick
        if return_url:  # Context: /dealers
            dealer_code = row.get("sap_dealer", sap)
            onclick = f"openUser('{row['id_cree']}', '{dealer_code}', '{return_url}')"
            # Ajouter data-nom, data-prenom, data-iwu pour la recherche
            nom_safe = str(row['nom']).replace("'", "")
            prenom_safe = str(row['prenom']).replace("'", "")
            iwu_safe = str(row['iwu_id']).replace("'", "")
            data_attr = f' data-dealer="{dealer_code}" data-dealer-match="{str(dealer_match).lower()}" data-nom="{nom_safe}" data-prenom="{prenom_safe}" data-iwu="{iwu_safe}"'
        else:  # Context: /compare
            onclick = f"openUser('{row['id_cree']}', '{sap}')"
            data_attr = ""
        
        cells = ""
        cells += f'<td onclick="{onclick}">{nom_prenom}</td>'
        cells += f'<td onclick="{onclick}">{iwu_val}</td>'
        
        rows.append(f'<tr class="{css}"{data_attr}>{cells}</tr>')

    table_class = "table table-bordered" if return_url else "table table-bordered table-striped"
    return f"<table class='{table_class}'>" + "".join(rows) + "</table>"
