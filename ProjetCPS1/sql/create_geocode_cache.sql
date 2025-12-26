-- Script pour créer et peupler la table de géocodage
-- Exécutez ce script dans pgAdmin sur la base IRIUM

-- 1) Créer la table de cache des coordonnées
CREATE TABLE IF NOT EXISTS geocode_cache (
    numcli INTEGER PRIMARY KEY,
    adresse_complete TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    source VARCHAR(50), -- 'BDD' si déjà dans cli_bse, 'BAN' si géocodé via API BAN
    date_geocodage TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2) Insérer les clients qui ont déjà des coordonnées dans cli_bse
INSERT INTO geocode_cache (numcli, adresse_complete, latitude, longitude, source)
SELECT 
    cbse_numcli,
    CONCAT_WS(', ', 
        NULLIF(TRIM(cbse_adr1), ''),
        NULLIF(TRIM(cbse_ptt), ''),
        NULLIF(TRIM(cbse_bureauptt), ''),
        'France'
    ),
    cbse_latitude,
    cbse_longitude,
    'BDD'
FROM cli_bse
WHERE cbse_latitude IS NOT NULL 
  AND cbse_longitude IS NOT NULL
ON CONFLICT (numcli) DO NOTHING;

-- 3) Vérifier combien de clients ont des coordonnées
SELECT 
    COUNT(*) AS total_clients,
    SUM(CASE WHEN cbse_latitude IS NOT NULL THEN 1 ELSE 0 END) AS avec_coords,
    SUM(CASE WHEN cbse_latitude IS NULL AND (cbse_ptt IS NOT NULL OR cbse_bureauptt IS NOT NULL) THEN 1 ELSE 0 END) AS avec_adresse_sans_coords
FROM cli_bse;

-- 4) Liste des clients à géocoder (avec adresse mais sans coords)
-- Exportez ce résultat en CSV pour le script de géocodage batch
SELECT 
    cbse_numcli AS numcli,
    CONCAT_WS(', ', 
        NULLIF(TRIM(cbse_adr1), ''),
        NULLIF(TRIM(cbse_ptt), ''),
        NULLIF(TRIM(cbse_bureauptt), ''),
        'France'
    ) AS adresse
FROM cli_bse
WHERE cbse_latitude IS NULL 
  AND (cbse_ptt IS NOT NULL OR cbse_bureauptt IS NOT NULL)
  AND NOT EXISTS (SELECT 1 FROM geocode_cache WHERE geocode_cache.numcli = cbse_numcli)
LIMIT 1000;
