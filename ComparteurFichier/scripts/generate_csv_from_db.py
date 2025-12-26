import psycopg2
import pandas as pd
import re

# Database connection
DB_HOST = "localhost"
DB_NAME = "dealerview"
DB_USER = "postgres"
DB_PASS = "123"

def get_conn():
    return psycopg2.connect(
        host=DB_HOST,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )

def parse_names_to_columns(sap_nom_string):
    """
    Parses 'IDOCS: Name1; WELCOME: Name2' into separate IDOCS and WELCOME strings.
    """
    if not sap_nom_string or pd.isna(sap_nom_string):
        return "", ""
    
    parts = [p.strip() for p in str(sap_nom_string).split(';')]
    
    idocs_names = []
    welcome_names = []
    
    for part in parts:
        if part.startswith("IDOCS:"):
            name = part.replace("IDOCS:", "").strip()
            if name and name not in idocs_names:
                idocs_names.append(name)
        elif part.startswith("WELCOME:"):
            name = part.replace("WELCOME:", "").strip()
            if name and name not in welcome_names:
                welcome_names.append(name)
                
    return " / ".join(idocs_names), " / ".join(welcome_names)

def main():
    conn = get_conn()
    
    print("Reading from con_nom table...")
    df = pd.read_sql("SELECT sap_princ, sap_nom FROM con_nom", conn)
    conn.close()
    
    print(f"Found {len(df)} rows.")
    
    # Apply parsing
    print("Parsing names...")
    # Apply returns a DataFrame if result_type='expand' is used, but simple apply returns Series of tuples
    # Let's do it simply
    
    results = []
    for _, row in df.iterrows():
        nom_idocs, nom_welcome = parse_names_to_columns(row['sap_nom'])
        results.append({
            'sap_princ': row['sap_princ'],
            'nom_idocs': nom_idocs,
            'nom_welcome': nom_welcome
        })
        
    df_out = pd.DataFrame(results)
    
    # Sort by sap_princ
    df_out = df_out.sort_values('sap_princ')
    
    # Export to CSV
    output_file = "DB_concession_names.csv"
    df_out.to_csv(output_file, index=False, encoding="utf-8-sig", sep=';')
    
    print(f"Generated {output_file}")
    print(df_out.head())

if __name__ == "__main__":
    main()
