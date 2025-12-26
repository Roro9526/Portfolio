const express = require('express');
const router = express.Router();
const caService = require('../services/caService');

/**
 * GET /api/chiffre-affaires
 * Récupère le CA par concession avec filtres optionnels
 * Query params: concession, categorie, code_gestion, groupe, constructeur
 */
router.get('/chiffre-affaires', async (req, res) => {
    try {
        // Normalisation des filtres en tableau
        const normalizeArray = (param) => {
            if (!param) return [];
            return Array.isArray(param) ? param : [param];
        };

        const filters = {
            concession: normalizeArray(req.query.concession),
            categorie: normalizeArray(req.query.categorie),
            code_gestion: normalizeArray(req.query.code_gestion),
            societe: normalizeArray(req.query.societe),
            constructeur: normalizeArray(req.query.constructeur),
            nature_operations: normalizeArray(req.query.nature_operation),
            date_n: req.query.date_n // Date N sélectionnée
        };

        // Nouvelle structure avec 4 requêtes séparées + fusion
        const result = await caService.getChiffreAffaires(filters);

        res.json({
            success: true,
            data: result.concessions,
            totaux: result.totals,
            count: result.concessions.length,
            annee_n: result.totals.annee_n,
            annee_n1: result.totals.annee_n1
        });
    } catch (error) {
        console.error('[API] Erreur chiffre-affaires:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/clients
 * Récupère la liste des clients avec leurs coordonnées GPS
 */
router.get('/clients', async (req, res) => {
    try {
        const normalizeArray = (param) => {
            if (!param) return [];
            return Array.isArray(param) ? param : [param];
        };

        const filters = {
            concession: normalizeArray(req.query.concession),
            categorie: normalizeArray(req.query.categorie),
            societe: normalizeArray(req.query.societe),
            constructeur: normalizeArray(req.query.constructeur),
            date_n: req.query.date_n
            // nature_operations pour les clients si besoin, sinon ignoré par le service
        };

        const data = await caService.getClients(filters);

        res.json({
            success: true,
            data: data,
            count: data.length
        });
    } catch (error) {
        console.error('[API] Erreur clients:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/clients/:numcli
 * Récupère le détail des achats d'un client spécifique
 */
router.get('/clients/:numcli', async (req, res, next) => {
    try {
        const numcli = parseInt(req.params.numcli);

        if (isNaN(numcli)) {
            return res.status(400).json({
                success: false,
                error: 'Numéro client invalide'
            });
        }

        // Récupérer la date N si fournie
        const filters = {
            date_n: req.query.date_n
        };

        const result = await caService.getDetailLignesClient(numcli, filters);

        res.json({
            success: true,
            client: result.client,
            lignes_magasin: result.lignes_magasin,
            lignes_atelier: result.lignes_atelier,
            totaux: result.totaux,
            count_magasin: result.lignes_magasin.length,
            count_atelier: result.lignes_atelier.length,
            annee_n: result.annee_n,
            annee_n1: result.annee_n1
        });
    } catch (error) {
        console.error('[API] Erreur détail client:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/filtres
 * Récupère les options disponibles pour les filtres
 */
router.get('/filtres', async (req, res, next) => {
    try {
        const filtres = await caService.getFiltres();
        res.json({
            success: true,
            data: filtres
        });
    } catch (error) {
        console.error('[API] Erreur filtres:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/status
 * Vérifie le statut de l'API et de la connexion BDD
 */
router.get('/status', async (req, res) => {
    const db = require('../services/dbService');
    const connected = await db.isConnected();

    res.json({
        success: true,
        api: 'online',
        database: connected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;

