import pandas as pd
import os
import sys

# ============================
# Configuration
# ============================
FILE_IDOCS = "donnees_lisible.xlsx"
FILE_APP = "App.xlsx"
OUTPUT_CSV = "DB_concession_names.csv"

def clean_sap(x):
    s = str(x).strip()
    if s.lower() == "nan" or s == "":
        return ""
    if s.endswith(".0"):
        s = s[:-2]
    return s

def main():
    # Vérification de la présence des fichiers
    if not os.path.exists(FILE_IDOCS):
        print(f"ERREUR: Le fichier '{FILE_IDOCS}' est introuvable.")
        print("Veuillez uploader le fichier Excel.")
        return
    if not os.path.exists(FILE_APP):
        print(f"ERREUR: Le fichier '{FILE_APP}' est introuvable.")
        print("Veuillez uploader le fichier Excel.")
        return

    print("Chargement des fichiers Excel...")
    try:
        df_idocs = pd.read_excel(FILE_IDOCS)
        df_app = pd.read_excel(FILE_APP)
    except Exception as e:
        print(f"Erreur lors de la lecture des fichiers Excel: {e}")
        return

    # Nettoyage des noms de colonnes
    df_idocs.columns = df_idocs.columns.str.strip()
    df_app.columns = df_app.columns.str.strip()

    # ============================
    # MAPPING IDOCS
    # ============================
    print("Traitement des données IDOCS...")
    idocs = df_idocs.copy()
    idocs["sap_dealer"] = idocs["Vendu au code SAP"].map(clean_sap)
    idocs["sap_princ"] = idocs["Code SAP du payeur"].map(clean_sap)
    idocs["sap_nom"] = idocs["Payer SAP Name"].fillna("").astype(str).str.strip()

    sap_idocs = idocs["sap_princ"].unique()

    # ============================
    # MAPPING WELCOME (APP)
    # ============================
    print("Traitement des données WELCOME...")
    app = df_app.copy()
    app["sap_dealer"] = app["SAP Officina"].map(clean_sap)
    app["sap_princ"] = app["SAP Dealer"].map(clean_sap)
    app["sap_nom"] = app["Company Name"].fillna("").astype(str).str.strip()

    sap_app = app["sap_princ"].unique()

    # ============================
    # LISTE DES SAP PRINCIPAUX UNIQUES
    # ============================
    all_sap_princ = list(set(list(sap_idocs) + list(sap_app)))
    all_sap_princ = [s for s in all_sap_princ if s and s.lower() != "nan"]
    
    df_sap = pd.DataFrame({"sap_princ": all_sap_princ})

    # ============================
    # LOGIQUE DE RECHERCHE DE NOM (STRICTE)
    # ============================
    
    def get_names_list(sap_id, source_df, source_name):
        # 1. Filtrer pour le SAP Principal donné
        rows = source_df[source_df["sap_princ"] == sap_id]
        
        if rows.empty:
            return []

        # 2. Essayer la condition STRICTE : SAP Dealer == SAP Principal
        strict_rows = rows[rows["sap_dealer"] == sap_id]

        if not strict_rows.empty:
            use_rows = strict_rows
        else:
            use_rows = rows
        
        # 3. Récupérer les noms uniques et ajouter le préfixe
        formatted_names = []
        seen_names = set()
        
        for _, r in use_rows.iterrows():
            nom = r["sap_nom"]
            if nom and nom.lower() != "nan" and nom not in seen_names:
                seen_names.add(nom)
                # Format: "SOURCE: Nom"
                formatted_names.append(f"{source_name}: {nom}")

        return formatted_names

    # ============================
    # CONSTRUCTION DU CSV FINAL
    # ============================
    print("Génération des noms combinés...")
    
    final_rows = []
    
    for _, row in df_sap.iterrows():
        sap_id = row["sap_princ"]
        
        # Récupérer les listes de noms
        names_idocs = get_names_list(sap_id, idocs, "IDOCS")
        names_welcome = get_names_list(sap_id, app, "WELCOME")
        
        # Combiner toutes les chaînes
        all_names = names_idocs + names_welcome
        
        # Joindre par des points-virgules
        sap_nom_combined = " ; ".join(all_names)
        
        final_rows.append({
            "sap_princ": sap_id,
            "sap_nom": sap_nom_combined
        })

    df_final = pd.DataFrame(final_rows)
    df_final = df_final.sort_values("sap_princ")

    # ============================
    # EXPORT
    # ============================
    # Export avec 2 colonnes : sap_princ, sap_nom
    df_final.to_csv(OUTPUT_CSV, index=False, encoding="utf-8-sig", sep=';')

    print(f"Succès ! Fichier généré : {OUTPUT_CSV}")
    print(f"Colonnes : {list(df_final.columns)}")
    print("-" * 30)
    print("Aperçu des 5 premières lignes :")
    print(df_final.head())

if __name__ == "__main__":
    main()
