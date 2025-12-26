/**
 * Script de géocodage batch utilisant l'API BAN (Base Adresse Nationale)
 * https://api-adresse.data.gouv.fr/
 * 
 * Avantages de l'API BAN:
 * - Gratuit et sans limite
 * - Données officielles françaises
 * - Supporte le batch (jusqu'à 10,000 adresses par requête)
 * 
 * Usage: node geocodeBatch.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration PostgreSQL
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'IRIUM',
    user: 'postgres',
    password: '123',
});

/**
 * Récupère les clients à géocoder (sans coordonnées)
 */
async function getClientsToGeocode(limit = 999999) {
    const result = await pool.query(`
        SELECT 
            cbse_numcli AS numcli,
            TRIM(cbse_adr1) AS adr1,
            TRIM(cbse_ptt) AS code_postal,
            TRIM(cbse_bureauptt) AS ville
        FROM cli_bse
        WHERE cbse_latitude IS NULL 
          AND (cbse_ptt IS NOT NULL OR cbse_bureauptt IS NOT NULL)
          AND NOT EXISTS (
              SELECT 1 FROM geocode_cache WHERE geocode_cache.numcli = cbse_numcli
          )
        LIMIT $1
    `, [limit]);

    return result.rows;
}

/**
 * Construit une adresse pour la recherche
 */
function buildAddress(client) {
    const parts = [];
    if (client.adr1) parts.push(client.adr1);
    if (client.code_postal) parts.push(client.code_postal);
    if (client.ville) parts.push(client.ville);
    return parts.join(' ');
}

/**
 * Géocode un batch d'adresses via l'API BAN
 * L'API BAN accepte un CSV avec une colonne d'adresses
 */
async function geocodeBatch(clients) {
    // Préparer le CSV pour l'API BAN
    let csvContent = 'id,adresse\n';
    clients.forEach(client => {
        const address = buildAddress(client).replace(/"/g, '""');
        csvContent += `${client.numcli},"${address}"\n`;
    });

    try {
        // Appel à l'API BAN en mode batch
        const FormData = (await import('form-data')).default;
        const fetch = (await import('node-fetch')).default;

        const formData = new FormData();
        formData.append('data', Buffer.from(csvContent), {
            filename: 'addresses.csv',
            contentType: 'text/csv',
        });
        formData.append('columns', 'adresse');

        const response = await fetch('https://api-adresse.data.gouv.fr/search/csv/', {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders(),
        });

        if (!response.ok) {
            throw new Error(`API BAN error: ${response.status}`);
        }

        const resultCsv = await response.text();
        return parseResultCsv(resultCsv);

    } catch (error) {
        console.error('Erreur géocodage batch:', error.message);
        // Fallback: géocoder individuellement
        return await geocodeIndividual(clients);
    }
}

/**
 * Parse le CSV de résultat de l'API BAN
 */
function parseResultCsv(csvContent) {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');

    const latIdx = headers.findIndex(h => h === 'latitude');
    const lngIdx = headers.findIndex(h => h === 'longitude');
    const idIdx = headers.findIndex(h => h === 'id');
    const scoreIdx = headers.findIndex(h => h === 'result_score');

    const results = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const lat = parseFloat(values[latIdx]);
        const lng = parseFloat(values[lngIdx]);
        const id = parseInt(values[idIdx]);
        const score = parseFloat(values[scoreIdx]);

        if (!isNaN(lat) && !isNaN(lng) && score > 0.4) {
            results.push({ numcli: id, lat, lng });
        }
    }
    return results;
}

/**
 * Fallback: géocodage individuel via l'API BAN
 */
async function geocodeIndividual(clients) {
    const fetch = (await import('node-fetch')).default;
    const results = [];

    for (const client of clients) {
        const address = buildAddress(client);
        const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address)}&limit=1`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.features && data.features.length > 0) {
                const [lng, lat] = data.features[0].geometry.coordinates;
                const score = data.features[0].properties.score;

                if (score > 0.4) {
                    results.push({ numcli: client.numcli, lat, lng });
                }
            }
        } catch (error) {
            console.warn(`Erreur géocodage ${client.numcli}:`, error.message);
        }

        // Petit délai pour ne pas surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    return results;
}

/**
 * Sauvegarde les résultats dans la table geocode_cache
 */
async function saveResults(results) {
    let saved = 0;

    for (const result of results) {
        try {
            await pool.query(`
                INSERT INTO geocode_cache (numcli, latitude, longitude, source)
                VALUES ($1, $2, $3, 'BAN')
                ON CONFLICT (numcli) DO UPDATE SET
                    latitude = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude,
                    source = 'BAN',
                    date_geocodage = CURRENT_TIMESTAMP
            `, [result.numcli, result.lat, result.lng]);
            saved++;
        } catch (error) {
            console.warn(`Erreur sauvegarde ${result.numcli}:`, error.message);
        }
    }

    return saved;
}

/**
 * Crée la table geocode_cache si elle n'existe pas
 */
async function ensureTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS geocode_cache (
            numcli INTEGER PRIMARY KEY,
            adresse_complete TEXT,
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            source VARCHAR(50),
            date_geocodage TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('✅ Table geocode_cache prête');
}

/**
 * Main
 */
async function main() {
    console.log('🗺️  Géocodage batch des clients...\n');

    try {
        // Créer la table si nécessaire
        await ensureTable();

        // Récupérer les clients à géocoder
        const clients = await getClientsToGeocode();
        console.log(`📋 ${clients.length} clients à géocoder`);

        if (clients.length === 0) {
            console.log('✨ Tous les clients sont déjà géocodés!');
            return;
        }

        // Géocoder par lots de 100
        const batchSize = 100;
        let totalGeocoded = 0;

        for (let i = 0; i < clients.length; i += batchSize) {
            const batch = clients.slice(i, i + batchSize);
            console.log(`\n🔄 Traitement lot ${Math.floor(i / batchSize) + 1}/${Math.ceil(clients.length / batchSize)}...`);

            const results = await geocodeIndividual(batch); // Utilise géocodage individuel (plus fiable)
            const saved = await saveResults(results);

            totalGeocoded += saved;
            console.log(`   ✅ ${saved}/${batch.length} géocodés`);
        }

        console.log(`\n🎉 Terminé! ${totalGeocoded} clients géocodés au total.`);

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await pool.end();
    }
}

main();
