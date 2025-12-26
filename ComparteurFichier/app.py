from flask import Flask, render_template, request
import pandas as pd

# Import des utilitaires depuis le module utils
from utils import get_conn, format_iwu_column, df_to_html, parse_multiple_names, normalize_id


def parse_nom_with_source(sap_nom_string):
    """
    Parse la chaine de noms comme: "IDOCS: SPL SECLIN; WELCOME: SPL HAUT DE FRANCE"
    Retourne une liste de noms formates avec leur source: W:, I:, ou W + I:
    """
    if not sap_nom_string or pd.isna(sap_nom_string):
        return []
    
    # Separer par point-virgule
    names = [n.strip() for n in str(sap_nom_string).split(';')]
    
    welcome_names = set()
    idocs_names = set()
    
    for name in names:
        if ':' in name:
            prefix, content = name.split(':', 1)
            prefix = prefix.strip().upper()
            content = content.strip()
            
            if prefix == "WELCOME" and content:
                welcome_names.add(content)
            elif prefix == "IDOCS" and content:
                idocs_names.add(content)
    
    # Trouver les noms communs
    common_names = welcome_names & idocs_names
    only_welcome = welcome_names - common_names
    only_idocs = idocs_names - common_names
    
    result = []
    for name in sorted(common_names):
        result.append(f"W + I: {name}")
    for name in sorted(only_welcome):
        result.append(f"W: {name}")
    for name in sorted(only_idocs):
        result.append(f"I: {name}")
    
    return result

# ===============================
# APP
# ===============================
app = Flask(__name__)

@app.route('/', methods=['GET'])
def home():
    search = request.args.get("search", "")
    show_matches = request.args.get("show_matches", "")  # Nouveau paramètre pour le filtre

    conn = get_conn()
    
    # Récupération des sap_princ distincts depuis les tables sso et idocs_user
    df_sso_princ = pd.read_sql("SELECT DISTINCT sap_princ FROM sso WHERE sap_princ IS NOT NULL", conn)
    df_idocs_princ = pd.read_sql("SELECT DISTINCT sap_princ FROM idocs_user WHERE sap_princ IS NOT NULL", conn)
    
    # Récupération des noms depuis la table con_nom
    df_con_nom = pd.read_sql("SELECT sap_princ, sap_nom FROM con_nom WHERE sap_princ IS NOT NULL", conn)
    
    # Récupération des utilisateurs pour comptage
    df_welcome_users = pd.read_sql("SELECT DISTINCT sap_princ, id_cree FROM sso WHERE sap_princ IS NOT NULL", conn)
    df_idocs_users = pd.read_sql("SELECT DISTINCT sap_princ, id_cree FROM idocs_user WHERE sap_princ IS NOT NULL", conn)
    
    conn.close()

    # Aggregation des comptes par sap_princ
    welcome_grp = df_welcome_users.groupby("sap_princ")["id_cree"].apply(lambda x: len(set(x)))
    idocs_grp = df_idocs_users.groupby("sap_princ")["id_cree"].apply(lambda x: len(set(x)))
    
    # Helper function pour parser les noms multiples avec filtrage par source
    def parse_names(sap_nom_string, source="WELCOME"):
        """
        Parse la chaîne de noms comme: "IDOCS: SPL SECLIN; WELCOME: SPL HAUT DE FRANCE; WELCOME: SPL LITTORAL"
        Filtre uniquement les noms correspondant à la source (WELCOME ou IDOCS)
        Retourne un dict avec toutes les infos et les noms formatés
        """
        if not sap_nom_string or pd.isna(sap_nom_string):
            return {"all_names": [], "display_name": "", "count": 0}
        
        # Séparer par point-virgule
        names = [n.strip() for n in str(sap_nom_string).split(';')]
        
        if len(names) == 0:
            return {"all_names": [], "display_name": "", "count": 0}
        
        # Filtrer et nettoyer les noms selon la source
        clean_names = []
        for name in names:
            # Vérifier si le nom contient le préfixe de la source
            if ':' in name:
                prefix, content = name.split(':', 1)
                prefix = prefix.strip().upper()
                content = content.strip()
                
                # Filtrer selon la source demandée
                if source == "WELCOME" and prefix == "WELCOME":
                    if content:
                        clean_names.append(content)
                elif source == "IDOCS" and prefix == "IDOCS":
                    if content:
                        clean_names.append(content)
            # Si pas de préfixe, on ignore le nom (on ne garde que les noms avec le bon préfixe)
        
        if len(clean_names) == 0:
            return {"all_names": [], "display_name": "", "count": 0}
        
        return {
            "all_names": clean_names,
            "display_name": clean_names[0],  # Premier nom
            "count": len(clean_names)
        }
    
    # Ensemble des IDs présents dans les deux
    sso_ids = set(df_sso_princ["sap_princ"])
    idocs_ids = set(df_idocs_princ["sap_princ"])
    
    # Construction de la liste SSO
    sso_dealers = []
    for _, row in df_sso_princ.iterrows():
        sap_princ = row["sap_princ"]
        
        # Vérifier si on doit filtrer uniquement les correspondances
        in_both = sap_princ in idocs_ids
        if show_matches and not in_both:
            continue
        
        # Récupération des noms depuis con_nom - filtrer par WELCOME
        name_row = df_con_nom[df_con_nom['sap_princ'] == sap_princ]
        sap_nom = name_row['sap_nom'].iloc[0] if len(name_row) > 0 else ""
        names_info = parse_names(sap_nom, source="WELCOME")
        
        # Ne pas afficher les dealers sans nom WELCOME valide
        if names_info["count"] == 0:
            continue
        
        # Filtrage par recherche
        if search:
            search_lower = search.lower()
            match = (search_lower in str(sap_princ).lower() or 
                    any(search_lower in name.lower() for name in names_info["all_names"]))
            if not match:
                continue
        
        sso_dealers.append({
            "sap_princ": sap_princ,
            "names_info": names_info,
            "count_users": welcome_grp.get(sap_princ, 0),
            "in_both": in_both
        })
    
    # Construction de la liste IDOCS
    idocs_dealers = []
    for _, row in df_idocs_princ.iterrows():
        sap_princ = row["sap_princ"]
        
        # Vérifier si on doit filtrer uniquement les correspondances
        in_both = sap_princ in sso_ids
        if show_matches and not in_both:
            continue
        
        # Récupération des noms depuis con_nom - filtrer par IDOCS
        name_row = df_con_nom[df_con_nom['sap_princ'] == sap_princ]
        sap_nom = name_row['sap_nom'].iloc[0] if len(name_row) > 0 else ""
        names_info = parse_names(sap_nom, source="IDOCS")
        
        # Ne pas afficher les dealers sans nom IDOCS valide
        if names_info["count"] == 0:
            continue
        
        # Filtrage par recherche
        if search:
            search_lower = search.lower()
            match = (search_lower in str(sap_princ).lower() or 
                    any(search_lower in name.lower() for name in names_info["all_names"]))
            if not match:
                continue
        
        idocs_dealers.append({
            "sap_princ": sap_princ,
            "names_info": names_info,
            "count_users": idocs_grp.get(sap_princ, 0),
            "in_both": in_both
        })
    
    # Tri par sap_princ
    sso_dealers = sorted(sso_dealers, key=lambda x: str(x['sap_princ']))
    idocs_dealers = sorted(idocs_dealers, key=lambda x: str(x['sap_princ']))
    
    # Calcul des statistiques pour le dashboard
    total_users_welcome = df_welcome_users['id_cree'].nunique()
    total_users_idocs = df_idocs_users['id_cree'].nunique()
    total_concessions_welcome = len(df_sso_princ)
    total_concessions_idocs = len(df_idocs_princ)
    total_concessions_both = len(sso_ids & idocs_ids)
    
    stats = {
        'total_users_welcome': total_users_welcome,
        'total_users_idocs': total_users_idocs,
        'total_concessions_welcome': total_concessions_welcome,
        'total_concessions_idocs': total_concessions_idocs,
        'total_concessions_both': total_concessions_both,
        'only_welcome': total_concessions_welcome - total_concessions_both,
        'only_idocs': total_concessions_idocs - total_concessions_both,
        'both': total_concessions_both
    }

    return render_template(
        "home.html",
        sso_dealers=sso_dealers,
        idocs_dealers=idocs_dealers,
        search=search,
        show_matches=show_matches,
        stats=stats
    )

# ===============================
# PAGE DEALERS D'UN SAP PRINCIPAL
# ===============================
@app.route('/dealers/<sap_princ>', methods=['GET'])
def dealers(sap_princ):
    conn = get_conn()
    
    # ============================
    # Récupération des noms depuis con_nom pour la concession principale
    # ============================
    df_con_nom = pd.read_sql(f"""
        SELECT sap_princ, sap_nom 
        FROM con_nom 
        WHERE sap_princ = '{sap_princ}'
    """, conn)
    
    # Parser les noms pour WELCOME et IDOCS
    welcome_names = []
    idocs_names = []
    
    if len(df_con_nom) > 0:
        sap_nom_string = df_con_nom['sap_nom'].iloc[0]
        welcome_names = parse_multiple_names(sap_nom_string, source="WELCOME")
        idocs_names = parse_multiple_names(sap_nom_string, source="IDOCS")
    
    # ============================
    # Récupération des noms des sous-concessions
    # ============================
    # On suppose que idocs_con contient: sap_dealer = Principal, sap_princ = Sub-Dealer
    df_names = pd.read_sql(f"""
        SELECT DISTINCT sap_princ, sap_nom
        FROM idocs_con
        WHERE sap_dealer = '{sap_princ}'
    """, conn)
    
    # Nom de la concession principale (Fallback sur le premier nom trouvé ou l'ID)
    sap_nom_princ = df_names['sap_nom'].iloc[0] if len(df_names) > 0 else sap_princ

    # ============================
    # Plus de sous-concessions (sap_dealer supprimé des tables users)
    # On travaille uniquement avec sap_princ maintenant
    # ============================
    dealers_list = []  # Plus de sous-dealers à afficher
    


    # ============================
    # CHARGEMENT DES UTILISATEURS (DETAILS)
    # ============================
    df_sso = pd.read_sql(f"""
        SELECT s.id_cree, s.nom, s.prenom, s.sap_princ,
               d.iwu_id
        FROM sso s
        LEFT JOIN sso_user_detail d ON s.id_cree = d.id_cree
        WHERE s.sap_princ = '{sap_princ}'
    """, conn)

    df_idocs = pd.read_sql(f"""
        SELECT s.id_cree, s.nom, s.prenom, s.sap_princ,
               d.iwu_id
        FROM idocs_user s
        LEFT JOIN idocs_user_detail d ON s.id_cree = d.id_cree
        WHERE s.sap_princ = '{sap_princ}'
    """, conn)
    
    conn.close()

    # ============================
    # GROUPEMENT DES IWU_ID
    # ============================
    def aggregate_iwu(df):
        grp = df.groupby(
            ["id_cree", "nom", "prenom"],
            dropna=False
        )["iwu_id"].apply(
            lambda x: ";".join(sorted({str(v) for v in x if v and v != "NONE"})) or "NONE"
        ).reset_index()
        return grp

    df_sso = aggregate_iwu(df_sso)
    df_idocs = aggregate_iwu(df_idocs)

    # ============================
    # NORMALISATION POUR COMPARAISON
    # ============================
    df_sso["id_norm"] = df_sso["id_cree"].apply(normalize_id)
    df_idocs["id_norm"] = df_idocs["id_cree"].apply(normalize_id)

    sso_ids = set(df_sso["id_norm"])
    idocs_ids = set(df_idocs["id_norm"])

    # Déterminer le status : "both" si existe dans les deux fichiers
    df_sso["status"] = df_sso["id_norm"].apply(lambda x: "both" if x in idocs_ids else "")
    df_idocs["status"] = df_idocs["id_norm"].apply(lambda x: "both" if x in sso_ids else "")

    # ============================
    # HTML GENERATION
    # ============================
    # df_to_html est importé depuis utils.formatters
    return_url = f"/dealers/{sap_princ}"
    html_sso = df_to_html(df_sso, sap=None, return_url=return_url)
    html_idocs = df_to_html(df_idocs, sap=None, return_url=return_url)
    
    # ============================
    # STATISTIQUES GLOBALES
    # ============================
    # Tous les IDs normalisés
    all_sso_ids = set(df_sso["id_norm"])
    all_idocs_ids = set(df_idocs["id_norm"])
    
    # Stats de croisement
    only_sso = all_sso_ids - all_idocs_ids
    only_idocs = all_idocs_ids - all_sso_ids
    in_both = all_sso_ids & all_idocs_ids
    
    # Users sans IWU_ID
    sso_no_iwu = df_sso[df_sso["iwu_id"] == "NONE"]["id_norm"].nunique()
    idocs_no_iwu = df_idocs[df_idocs["iwu_id"] == "NONE"]["id_norm"].nunique()
    
    dealer_stats = {
        "total_sso": len(all_sso_ids),
        "total_idocs": len(all_idocs_ids),
        "only_sso": len(only_sso),
        "only_idocs": len(only_idocs),
        "in_both": len(in_both),
        "sso_no_iwu": sso_no_iwu,
        "idocs_no_iwu": idocs_no_iwu
    }
    
    return render_template(
        "dealers.html",
        sap_princ=sap_princ,
        sap_nom_princ=sap_nom_princ,
        dealers=dealers_list,
        sso=html_sso,
        idocs=html_idocs,
        count_sso=len(df_sso),
        count_idocs=len(df_idocs),
        welcome_names=welcome_names,
        idocs_names=idocs_names,
        dealer_stats=dealer_stats
    )


# ============================================================
# FONCTION : Construction du tableau user + aggregation IWU_ID
# ============================================================
def build_user_table(df):
    possible_cols = ["iwu_id", "IWU_ID", "iwu", "iwu id", "Iveco Welcome User Id"]
    true_col = None

    for c in possible_cols:
        if c in df.columns:
            true_col = c
            break

    if true_col is None:
        df["iwu_id"] = "NONE"
    else:
        df["iwu_id"] = df[true_col].replace("", "NONE").fillna("NONE").astype(str)

    group_cols = ["id_cree", "nom", "prenom"]

    agg = (
        df.groupby(group_cols, dropna=False)["iwu_id"]
        .apply(lambda s: ";".join(sorted({v for v in s if v != "NONE"})) or "NONE")
        .reset_index(name="iwu_id")
    )

    return agg

# ===============================
# PAGE COMPARAISON CONCESSION
# ===============================
@app.route('/compare', methods=['GET', 'POST'])
def compare():

    if request.method == "POST":
        sap_code = request.form.get("sap_princ")
    else:
        sap_code = request.args.get("sap_princ")

    conn = get_conn()

    # ============================
    # Nom de la concession
    # ============================
    df_conc = pd.read_sql(f"""
        SELECT DISTINCT sap_nom, sap_princ
        FROM con_nom
        WHERE sap_princ = '{sap_code}'
    """, conn)
    sap_nom = df_conc["sap_nom"].iloc[0] if len(df_conc) > 0 else sap_code
    sap_princ = sap_code

    # ============================
    # CHARGEMENT DES TABLES BRUTES
    # ============================
    df_sso = pd.read_sql(f"""
        SELECT s.id_cree, s.nom, s.prenom, s.sap_princ,
               d.iwu_id
        FROM sso s
        LEFT JOIN sso_user_detail d ON s.id_cree = d.id_cree
        WHERE s.sap_princ = '{sap_code}'
    """, conn)

    df_idocs = pd.read_sql(f"""
        SELECT s.id_cree, s.nom, s.prenom, s.sap_princ,
               d.iwu_id
        FROM idocs_user s
        LEFT JOIN idocs_user_detail d ON s.id_cree = d.id_cree
        WHERE s.sap_princ = '{sap_code}'
    """, conn)

    df_all_saps = pd.read_sql("""
        SELECT DISTINCT sap_princ
        FROM con_nom
        ORDER BY sap_princ
    """, conn)

    conn.close()

    # ============================
    # GROUPEMENT DES IWU_ID
    # ============================
    def aggregate_iwu(df):
        grp = df.groupby(
            ["id_cree", "nom", "prenom"],
            dropna=False
        )["iwu_id"].apply(
            lambda x: ";".join(sorted({str(v) for v in x if v and v != "NONE"})) or "NONE"
        ).reset_index()
        return grp

    df_sso = aggregate_iwu(df_sso)
    df_idocs = aggregate_iwu(df_idocs)

    # ============================
    # NORMALISATION POUR COMPARAISON
    # ============================
    df_sso["id_norm"] = df_sso["id_cree"].apply(normalize_id)
    df_idocs["id_norm"] = df_idocs["id_cree"].apply(normalize_id)

    sso_ids = set(df_sso["id_norm"])
    idocs_ids = set(df_idocs["id_norm"])

    df_sso["status"] = df_sso["id_norm"].apply(lambda x: "both" if x in idocs_ids else "")
    df_idocs["status"] = df_idocs["id_norm"].apply(lambda x: "both" if x in sso_ids else "")

    # ============================
    # HTML
    # ============================
    # df_to_html est importé depuis utils.formatters
    html_sso = df_to_html(df_sso, sap_code)
    html_idocs = df_to_html(df_idocs, sap_code)

    all_saps = df_all_saps["sap_princ"].tolist()

    return render_template(
        "compare.html",
        sap=sap_code,
        sap_nom=sap_nom,
        sap_princ=sap_princ,
        sso=html_sso,
        idocs=html_idocs,
        count_sso=len(df_sso),
        count_idocs=len(df_idocs),
        all_saps=all_saps
    )


# ===============================
# PAGE LISTE UTILISATEURS
# ===============================
@app.route('/user', methods=['GET'])
def home_user():
    conn = get_conn()
    df = pd.read_sql("""
        SELECT DISTINCT id_cree, nom, prenom
        FROM idocs_user_detail
        UNION
        SELECT DISTINCT id_cree, nom, prenom
        FROM sso_user_detail
        ORDER BY nom ASC
    """, conn)
    conn.close()

    return render_template(
        "home_user.html",
        users=df.to_dict(orient="records")
    )

# ===============================
# PAGE COMPARAISON UTILISATEUR
# ===============================
@app.route('/compare_user', methods=['GET'])
def compare_user():
    id_cree = request.args.get("id")
    sap = request.args.get("sap")

    id_norm = normalize_id(id_cree)

    conn = get_conn()
    
    # OPTIMISATION: Requêtes ciblées avec WHERE au lieu de SELECT * entier
    # Récupérer uniquement les données de cet utilisateur
    df_sso = pd.read_sql(f"""
        SELECT * FROM sso_user_detail 
        WHERE id_cree = %s OR LOWER(REPLACE(id_cree, ' ', '')) = %s
    """, conn, params=[id_cree, id_norm])
    
    df_idocs = pd.read_sql(f"""
        SELECT * FROM idocs_user_detail 
        WHERE id_cree = %s OR LOWER(REPLACE(id_cree, ' ', '')) = %s
    """, conn, params=[id_cree, id_norm])
    
    # Tables users pour recuperer les sap_princ (requête ciblée)
    df_sso_users = pd.read_sql(f"""
        SELECT DISTINCT id_cree, sap_princ FROM sso 
        WHERE id_cree = %s OR LOWER(REPLACE(id_cree, ' ', '')) = %s
    """, conn, params=[id_cree, id_norm])
    
    df_idocs_users = pd.read_sql(f"""
        SELECT DISTINCT id_cree, sap_princ FROM idocs_user 
        WHERE id_cree = %s OR LOWER(REPLACE(id_cree, ' ', '')) = %s
    """, conn, params=[id_cree, id_norm])
    
    # Table des noms de concessions (petite table, OK de tout charger)
    df_con_nom = pd.read_sql("SELECT sap_princ, sap_nom FROM con_nom", conn)

    sso_identite = df_sso[["nom", "prenom"]].drop_duplicates().to_dict(orient="records")
    idocs_identite = df_idocs[["nom", "prenom"]].drop_duplicates().to_dict(orient="records")

    sso_iwu = df_sso[["iwu_id"]].drop_duplicates().to_dict(orient="records") if "iwu_id" in df_sso.columns else []
    idocs_iwu = df_idocs[["iwu_id"]].drop_duplicates().to_dict(orient="records") if "iwu_id" in df_idocs.columns else []

    # Recuperer les societes via sap_princ
    # Pour SSO : trouver tous les sap_princ de cet utilisateur
    sso_user_princs = df_sso_users[df_sso_users["id_cree"].apply(normalize_id) == id_norm]["sap_princ"].unique()
    sso_societe = []
    for princ in sso_user_princs:
        nom_row = df_con_nom[df_con_nom["sap_princ"] == princ]
        raw_nom = nom_row["sap_nom"].iloc[0] if len(nom_row) > 0 else ""
        noms_formates = parse_nom_with_source(raw_nom)
        sso_societe.append({"sap_princ": princ, "sap_noms": noms_formates})
    
    # Pour IDOCS : trouver tous les sap_princ de cet utilisateur
    idocs_user_princs = df_idocs_users[df_idocs_users["id_cree"].apply(normalize_id) == id_norm]["sap_princ"].unique()
    idocs_societe = []
    for princ in idocs_user_princs:
        nom_row = df_con_nom[df_con_nom["sap_princ"] == princ]
        raw_nom = nom_row["sap_nom"].iloc[0] if len(nom_row) > 0 else ""
        noms_formates = parse_nom_with_source(raw_nom)
        idocs_societe.append({"sap_princ": princ, "sap_noms": noms_formates})

    idocs_metier = df_idocs[["marque", "typeprofil"]].drop_duplicates().to_dict(orient="records") \
        if "marque" in df_idocs.columns else []

    # ============================
    # DETECTION DOUBLONS IWU (OPTIMISE)
    # ============================
    duplicates = []
    current_iwu_ids = set()
    
    # Collecter tous les IWU IDs de l'utilisateur actuel
    for u in sso_iwu:
        if u.get("iwu_id") and u["iwu_id"] != "NONE":
            current_iwu_ids.add(u["iwu_id"])
    for u in idocs_iwu:
        if u.get("iwu_id") and u["iwu_id"] != "NONE":
            current_iwu_ids.add(u["iwu_id"])
    
    # Chercher d'autres utilisateurs avec les memes IWU IDs (requêtes SQL ciblées)
    if current_iwu_ids:
        iwu_list = list(current_iwu_ids)
        placeholders = ','.join(['%s'] * len(iwu_list))
        
        # SSO: chercher doublons
        df_sso_dups = pd.read_sql(f"""
            SELECT DISTINCT id_cree, nom, prenom, iwu_id 
            FROM sso_user_detail 
            WHERE iwu_id IN ({placeholders})
            AND id_cree != %s
            AND LOWER(REPLACE(id_cree, ' ', '')) != %s
        """, conn, params=iwu_list + [id_cree, id_norm])
        
        for _, row in df_sso_dups.iterrows():
            dup_id = row["id_cree"]
            if not any(d["id_cree"] == dup_id for d in duplicates):
                duplicates.append({
                    "id_cree": dup_id,
                    "nom": row.get("nom", ""),
                    "prenom": row.get("prenom", ""),
                    "iwu_id": row["iwu_id"],
                    "source": "SSO"
                })
        
        # IDOCS: chercher doublons
        df_idocs_dups = pd.read_sql(f"""
            SELECT DISTINCT id_cree, nom, prenom, iwu_id 
            FROM idocs_user_detail 
            WHERE iwu_id IN ({placeholders})
            AND id_cree != %s
            AND LOWER(REPLACE(id_cree, ' ', '')) != %s
        """, conn, params=iwu_list + [id_cree, id_norm])
        
        for _, row in df_idocs_dups.iterrows():
            dup_id = row["id_cree"]
            if not any(d["id_cree"] == dup_id for d in duplicates):
                duplicates.append({
                    "id_cree": dup_id,
                    "nom": row.get("nom", ""),
                    "prenom": row.get("prenom", ""),
                    "iwu_id": row["iwu_id"],
                    "source": "IDOCS"
                })
    
    # Fermer connexion après toutes les requêtes
    conn.close()

    # ============================
    # STATISTIQUES UTILISATEUR
    # ============================
    user_stats = {
        "nb_identite": {
            "welcome": len(sso_identite),
            "idocs": len(idocs_identite),
        },
        "nb_dealer": {
            "welcome": len(sso_societe),
            "idocs": len(idocs_societe),
        },
        "nb_iwu_id": {
            "welcome": len([u for u in sso_iwu if u.get("iwu_id") and u["iwu_id"] != "NONE"]),
            "idocs": len([u for u in idocs_iwu if u.get("iwu_id") and u["iwu_id"] != "NONE"]),
        }
    }
    # Calculer les deltas
    for key in user_stats:
        user_stats[key]["delta"] = user_stats[key]["welcome"] - user_stats[key]["idocs"]

    return render_template(
        "compare_user.html",
        id_cree=id_cree,
        sap=sap,
        sso_identite=sso_identite,
        sso_iwu=sso_iwu,
        sso_societe=sso_societe,
        idocs_identite=idocs_identite,
        idocs_iwu=idocs_iwu,
        idocs_societe=idocs_societe,
        idocs_metier=idocs_metier,
        duplicates=duplicates,
        user_stats=user_stats
    )

# ===============================
# PAGE RECHERCHE UTILISATEUR
# ===============================
@app.route('/search_user', methods=['GET', 'POST'])
def search_user():
    results = []
    search_term = ""
    
    if request.method == 'POST':
        search_term = request.form.get("search", "").strip()
        
        if search_term and len(search_term) >= 2:
            conn = get_conn()
            
            # Recherche unifiée dans SSO et IDOCS
            search_pattern = f"%{search_term}%"
            
            query = """
                SELECT DISTINCT id_cree, nom, prenom, iwu_id, 'SSO' as source
                FROM sso_user_detail 
                WHERE nom LIKE %s OR prenom LIKE %s OR iwu_id LIKE %s
                UNION
                SELECT DISTINCT id_cree, nom, prenom, iwu_id, 'IDOCS' as source
                FROM idocs_user_detail 
                WHERE nom LIKE %s OR prenom LIKE %s OR iwu_id LIKE %s
                LIMIT 100
            """
            
            df_results = pd.read_sql(query, conn, params=[
                search_pattern, search_pattern, search_pattern,
                search_pattern, search_pattern, search_pattern
            ])
            
            conn.close()
            
            # Grouper par id_cree pour éviter les doublons
            grouped = {}
            for _, row in df_results.iterrows():
                id_cree = row["id_cree"]
                if id_cree not in grouped:
                    grouped[id_cree] = {
                        "id_cree": id_cree,
                        "nom": row["nom"],
                        "prenom": row["prenom"],
                        "iwu_id": row["iwu_id"] if row["iwu_id"] and row["iwu_id"] != "NONE" else "",
                        "sources": set()
                    }
                grouped[id_cree]["sources"].add(row["source"])
            
            # Convertir en liste avec source formatée
            for id_cree, data in grouped.items():
                data["source"] = " + ".join(sorted(data["sources"]))
                del data["sources"]
                results.append(data)
    
    return render_template(
        "search_user.html",
        results=results,
        search_term=search_term
    )


# ===============================
# RUN SERVER
# ===============================
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
