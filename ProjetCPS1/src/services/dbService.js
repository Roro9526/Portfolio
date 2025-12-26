const { Pool } = require('pg');

// Configuration PostgreSQL pour la base IRIUM
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'IRIUM',
    user: 'postgres',
    password: '123',
});

// Test de connexion au démarrage
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Erreur connexion PostgreSQL:', err.message);
    } else {
        console.log(`✅ PostgreSQL connecté à ${pool.options.database} sur ${pool.options.host}:${pool.options.port} (User: ${pool.options.user})`);
        console.log('Timestamp DB:', res.rows[0].now);
    }
});

/**
 * Exécute une requête SQL sur PostgreSQL
 * @param {string} sql - Requête SQL
 * @param {Array} params - Paramètres de la requête
 * @returns {Promise<Array>} - Résultats de la requête
 */
async function query(sql, params = []) {
    try {
        const result = await pool.query(sql, params);
        return result.rows;
    } catch (error) {
        console.error('[DB ERROR]', error.message);
        throw error;
    }
}

/**
 * Vérifie si la connexion PostgreSQL est active
 * @returns {Promise<boolean>}
 */
async function isConnected() {
    try {
        await pool.query('SELECT 1');
        return true;
    } catch {
        return false;
    }
}

module.exports = {
    query,
    isConnected,
    pool
};
