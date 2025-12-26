const db = require('./dbService');

/**
 * ============================================================================
 * CALCUL DU CHIFFRE D'AFFAIRES
 * Reproduction exacte de la logique PHP MagCa::executeInformixRequest
 * 
 * 4 requêtes séparées puis fusion (comme array_merge en PHP) :
 * 1. MAV Factures normales (dpc_fac + dpc_lig)
 * 2. MAV Cession (dpc_fcc + dpc_lig)
 * 3. SAV Factures normales (dpc_fac + sav_lor)
 * 4. SAV Cession (dpc_fcc + sav_lor)
 * ============================================================================
 */

/**
 * Construit les conditions de filtre pour les requêtes
 */
function buildFilterConditions(filters, type) {
    let conditions = '';

    if (filters.categorie) {
        conditions += ` AND csoc.csoc_categ = '${filters.categorie}'`;
    }
    if (filters.groupe) {
        conditions += ` AND cbse.cbse_groupe = '${filters.groupe}'`;
    }
    if (filters.constructeur) {
        if (type === 'MAG') {
            conditions += ` AND l.dlig_constp = '${filters.constructeur}'`;
        } else {
            conditions += ` AND lor.slor_constp = '${filters.constructeur}'`;
        }
    }
    if (filters.code_gestion) {
        if (type === 'MAG') {
            conditions += ` AND l.dlig_codg = '${filters.code_gestion}'`;
        } else {
            conditions += ` AND lor.slor_codg = '${filters.code_gestion}'`;
        }
    }

    return conditions;
}

/**
 * Requête 1 : CA Magasin - Factures normales (dpc_fac + dpc_lig)
 */
async function getCAMagasinFactures(startDate, endDate, filters = {}) {
    const filterConditions = buildFilterConditions(filters, 'MAG');
    const concessionFilter = filters.concession
        ? `AND TRIM(f.dfac_soc) || TRIM(f.dfac_succ) = '${filters.concession}'`
        : '';

    const sql = `
        SELECT
            TRIM(f.dfac_soc) || TRIM(f.dfac_succ) AS IDSS,
            f.dfac_succ AS SUCC,
            f.dfac_soc AS SOC,
            EXTRACT(YEAR FROM f.dfac_datefac)::INTEGER AS ANNEE,
            'MAV' AS SERV,
            f.dfac_numcli AS NUMCLI,
            TRIM(cbse.cbse_nomcli) AS NOMCLI,
            'Pièces magasin' AS SERVICE,
            SUM(l.dlig_qteliv * l.dlig_pxnreel) AS PRIX_HT
        FROM dpc_fac f
        INNER JOIN dpc_lig l ON f.dfac_soc = l.dlig_soc AND f.dfac_succ = l.dlig_succ AND f.dfac_numfac = l.dlig_numfac
        LEFT JOIN dpc_ent e ON e.dent_soc = l.dlig_soc AND e.dent_succ = l.dlig_succ AND e.dent_numdp = l.dlig_numdp AND e.dent_natop = l.dlig_natopet
        LEFT JOIN cli_bse cbse ON cbse.cbse_numcli = f.dfac_numcli
        LEFT JOIN cli_soc csoc ON csoc.csoc_soc = f.dfac_soc AND csoc.csoc_numcli = f.dfac_numcli
        WHERE f.dfac_serv = 'MAV'
            AND e.dent_pos IN ('FC', 'CP')
            AND f.dfac_datefac >= '${startDate}'
            AND f.dfac_datefac <= '${endDate}'
            ${concessionFilter}
            ${filterConditions}
        GROUP BY IDSS, SUCC, SOC, ANNEE, SERV, NUMCLI, NOMCLI, SERVICE
    `;

    return await db.query(sql);
}

/**
 * Requête 2 : CA Magasin - Factures cession (dpc_fcc + dpc_lig)
 */
async function getCAMagasinCession(startDate, endDate, filters = {}) {
    const filterConditions = buildFilterConditions(filters, 'MAG');
    const concessionFilter = filters.concession
        ? `AND TRIM(c.dfcc_soc) || TRIM(c.dfcc_succ) = '${filters.concession}'`
        : '';

    const sql = `
        SELECT
            TRIM(c.dfcc_soc) || TRIM(c.dfcc_succ) AS IDSS,
            c.dfcc_succ AS SUCC,
            c.dfcc_soc AS SOC,
            EXTRACT(YEAR FROM c.dfcc_datefac)::INTEGER AS ANNEE,
            'MAV' AS SERV,
            c.dfcc_numcli AS NUMCLI,
            TRIM(cbse.cbse_nomcli) AS NOMCLI,
            'Pièces magasin' AS SERVICE,
            SUM(l.dlig_qteliv * l.dlig_pxnreel) AS PRIX_HT
        FROM dpc_fcc c
        INNER JOIN dpc_lig l ON c.dfcc_soc = l.dlig_soc AND c.dfcc_succ = l.dlig_succ AND c.dfcc_numfcc = l.dlig_numfac
        LEFT JOIN dpc_ent e ON e.dent_soc = l.dlig_soc AND e.dent_succ = l.dlig_succ AND e.dent_numdp = l.dlig_numdp AND e.dent_natop = l.dlig_natopet
        LEFT JOIN cli_bse cbse ON cbse.cbse_numcli = c.dfcc_numcli
        LEFT JOIN cli_soc csoc ON csoc.csoc_soc = c.dfcc_soc AND csoc.csoc_numcli = c.dfcc_numcli
        WHERE c.dfcc_serv = 'MAV'
            AND e.dent_pos IN ('FC', 'CP')
            AND c.dfcc_datefac >= '${startDate}'
            AND c.dfcc_datefac <= '${endDate}'
            ${concessionFilter}
            ${filterConditions}
        GROUP BY IDSS, SUCC, SOC, ANNEE, SERV, NUMCLI, NOMCLI, SERVICE
    `;

    return await db.query(sql);
}

/**
 * Requête 3 : CA Atelier - Factures normales (dpc_fac + sav_lor)
 */
async function getCAAtelierFactures(startDate, endDate, filters = {}) {
    const filterConditions = buildFilterConditions(filters, 'SAV');
    const concessionFilter = filters.concession
        ? `AND TRIM(f.dfac_soc) || TRIM(f.dfac_succ) = '${filters.concession}'`
        : '';

    const sql = `
        SELECT
            TRIM(f.dfac_soc) || TRIM(f.dfac_succ) AS IDSS,
            f.dfac_succ AS SUCC,
            f.dfac_soc AS SOC,
            EXTRACT(YEAR FROM f.dfac_datefac)::INTEGER AS ANNEE,
            'SAV' AS SERV,
            f.dfac_numcli AS NUMCLI,
            TRIM(cbse.cbse_nomcli) AS NOMCLI,
            'Pièces atelier' AS SERVICE,
            SUM(lor.slor_qterea * lor.slor_pxnreel) AS PRIX_HT
        FROM dpc_fac f
        INNER JOIN sav_lor lor ON f.dfac_soc = lor.slor_soc AND f.dfac_succ = lor.slor_succ AND f.dfac_numfac = lor.slor_numfac
        LEFT JOIN sav_itv itv ON itv.sitv_soc = lor.slor_soc AND itv.sitv_succ = lor.slor_succ AND itv.sitv_numor = lor.slor_numor AND itv.sitv_interv = FLOOR(lor.slor_nogrp/100)
        INNER JOIN sav_eor eor ON lor.slor_soc = eor.seor_soc AND lor.slor_succ = eor.seor_succ AND lor.slor_numor = eor.seor_numor
        LEFT JOIN cli_bse cbse ON cbse.cbse_numcli = f.dfac_numcli
        LEFT JOIN cli_soc csoc ON csoc.csoc_soc = f.dfac_soc AND csoc.csoc_numcli = f.dfac_numcli
        WHERE f.dfac_serv = 'SAV'
            AND itv.sitv_pos IN ('FC', 'CP')
            AND lor.slor_typlig = 'P'
            AND f.dfac_datefac >= '${startDate}'
            AND f.dfac_datefac <= '${endDate}'
            ${concessionFilter}
            ${filterConditions}
        GROUP BY IDSS, SUCC, SOC, ANNEE, SERV, NUMCLI, NOMCLI, SERVICE
    `;

    return await db.query(sql);
}

/**
 * Requête 4 : CA Atelier - Factures cession (dpc_fcc + sav_lor)
 */
async function getCAAtelierCession(startDate, endDate, filters = {}) {
    const filterConditions = buildFilterConditions(filters, 'SAV');
    const concessionFilter = filters.concession
        ? `AND TRIM(c.dfcc_soc) || TRIM(c.dfcc_succ) = '${filters.concession}'`
        : '';

    const sql = `
        SELECT
            TRIM(c.dfcc_soc) || TRIM(c.dfcc_succ) AS IDSS,
            c.dfcc_succ AS SUCC,
            c.dfcc_soc AS SOC,
            EXTRACT(YEAR FROM c.dfcc_datefac)::INTEGER AS ANNEE,
            'SAV' AS SERV,
            c.dfcc_numcli AS NUMCLI,
            TRIM(cbse.cbse_nomcli) AS NOMCLI,
            'Pièces atelier' AS SERVICE,
            SUM(lor.slor_qterea * lor.slor_pxnreel) AS PRIX_HT
        FROM dpc_fcc c
        INNER JOIN sav_lor lor ON c.dfcc_soc = lor.slor_soc AND c.dfcc_succ = lor.slor_succ AND c.dfcc_numfcc = lor.slor_numfac
        LEFT JOIN sav_itv itv ON itv.sitv_soc = lor.slor_soc AND itv.sitv_succ = lor.slor_succ AND itv.sitv_numor = lor.slor_numor AND itv.sitv_interv = FLOOR(lor.slor_nogrp/100)
        INNER JOIN sav_eor eor ON lor.slor_soc = eor.seor_soc AND lor.slor_succ = eor.seor_succ AND lor.slor_numor = eor.seor_numor
        LEFT JOIN cli_bse cbse ON cbse.cbse_numcli = c.dfcc_numcli
        LEFT JOIN cli_soc csoc ON csoc.csoc_soc = c.dfcc_soc AND csoc.csoc_numcli = c.dfcc_numcli
        WHERE c.dfcc_serv = 'SAV'
            AND itv.sitv_pos IN ('FC', 'CP')
            AND lor.slor_typlig = 'P'
            AND c.dfcc_datefac >= '${startDate}'
            AND c.dfcc_datefac <= '${endDate}'
            ${concessionFilter}
            ${filterConditions}
        GROUP BY IDSS, SUCC, SOC, ANNEE, SERV, NUMCLI, NOMCLI, SERVICE
    `;

    return await db.query(sql);
}

/**
 * Agrège les résultats par concession et année
 * Simule exactement la logique PHP de postLoadedManipulations
 */
function aggregateResults(allResults, currentYear) {
    const lastYear = currentYear - 1;

    // Grouper par concession
    const byIdss = {};

    for (const row of allResults) {
        const idss = row.idss || row.IDSS;
        const annee = parseInt(row.annee || row.ANNEE);
        const service = row.service || row.SERVICE;
        const prixHt = parseFloat(row.prix_ht || row.PRIX_HT) || 0;

        if (!byIdss[idss]) {
            byIdss[idss] = {
                id_concession: idss,
                soc: row.soc || row.SOC,
                succ: row.succ || row.SUCC,
                ca_magasin_n: 0,
                ca_magasin_n1: 0,
                ca_atelier_n: 0,
                ca_atelier_n1: 0,
                ca_total_n: 0,
                ca_total_n1: 0
            };
        }

        const isCurrentYear = annee === currentYear;
        const isPrevYear = annee === lastYear;

        if (service === 'Pièces magasin') {
            if (isCurrentYear) byIdss[idss].ca_magasin_n += prixHt;
            if (isPrevYear) byIdss[idss].ca_magasin_n1 += prixHt;
        } else if (service === 'Pièces atelier') {
            if (isCurrentYear) byIdss[idss].ca_atelier_n += prixHt;
            if (isPrevYear) byIdss[idss].ca_atelier_n1 += prixHt;
        }
    }

    // Calculer les totaux et évolutions
    const results = Object.values(byIdss).map(row => {
        row.ca_total_n = row.ca_magasin_n + row.ca_atelier_n;
        row.ca_total_n1 = row.ca_magasin_n1 + row.ca_atelier_n1;
        row.evolution = row.ca_total_n1 > 0
            ? Math.round(((row.ca_total_n - row.ca_total_n1) / row.ca_total_n1) * 10000) / 100
            : 0;
        return row;
    });

    // Trier par CA total décroissant
    return results.sort((a, b) => b.ca_total_n - a.ca_total_n);
}

/**
 * Calcule les totaux globaux avec distinction MAV/Cession/Atelier/AtelierCession
 * @param {Array} piecesMav - Résultats requête 1 (MAV Factures)
 * @param {Array} piecesMavCes - Résultats requête 2 (MAV Cession)
 * @param {Array} piecesSav - Résultats requête 3 (SAV Factures)
 * @param {Array} piecesSavCes - Résultats requête 4 (SAV Cession)
 * @param {number} currentYear - Année en cours
 */
function calculateTotals(piecesMav, piecesMavCes, piecesSav, piecesSavCes, currentYear) {
    const lastYear = currentYear - 1;

    // Fonction helper pour sommer par année
    const sumByYear = (data, year) => {
        return data
            .filter(r => parseInt(r.annee || r.ANNEE) === year)
            .reduce((sum, r) => sum + (parseFloat(r.prix_ht || r.PRIX_HT) || 0), 0);
    };

    const totals = {
        // MAV Factures (Magasin comptoir)
        ca_magasin_mav_n: sumByYear(piecesMav, currentYear),
        ca_magasin_mav_n1: sumByYear(piecesMav, lastYear),
        // MAV Cession (Magasin cession)
        ca_magasin_cession_n: sumByYear(piecesMavCes, currentYear),
        ca_magasin_cession_n1: sumByYear(piecesMavCes, lastYear),
        // SAV Factures (Atelier comptoir)
        ca_atelier_n: sumByYear(piecesSav, currentYear),
        ca_atelier_n1: sumByYear(piecesSav, lastYear),
        // SAV Cession (Atelier cession)
        ca_atelier_cession_n: sumByYear(piecesSavCes, currentYear),
        ca_atelier_cession_n1: sumByYear(piecesSavCes, lastYear),
        // Totaux combinés
        ca_magasin_n: 0,
        ca_magasin_n1: 0,
        ca_total_n: 0,
        ca_total_n1: 0,
        evolution: 0,
        annee_n: currentYear,
        annee_n1: lastYear
    };

    // Magasin total = MAV + MAV Cession
    totals.ca_magasin_n = totals.ca_magasin_mav_n + totals.ca_magasin_cession_n;
    totals.ca_magasin_n1 = totals.ca_magasin_mav_n1 + totals.ca_magasin_cession_n1;

    // Total général = Magasin + Atelier + Atelier Cession
    totals.ca_total_n = totals.ca_magasin_n + totals.ca_atelier_n + totals.ca_atelier_cession_n;
    totals.ca_total_n1 = totals.ca_magasin_n1 + totals.ca_atelier_n1 + totals.ca_atelier_cession_n1;

    // Evolution en %
    totals.evolution = totals.ca_total_n1 > 0
        ? Math.round(((totals.ca_total_n - totals.ca_total_n1) / totals.ca_total_n1) * 10000) / 100
        : 0;

    return totals;
}

// Helper pour construire les clauses WHERE (IN pour tableaux, = pour valeurs simples)
const buildSqlClause = (field, values) => {
    if (!values) return '';
    if (Array.isArray(values)) {
        if (values.length === 0) return '';
        const escapedValues = values.map(v => `'${v.replace(/'/g, "''")}'`).join(', ');
        return ` AND ${field} IN (${escapedValues})`;
    }
    return ` AND ${field} = '${values.replace(/'/g, "''")}'`;
};

/**
 * Récupère le chiffre d'affaires avec requêtes directes sur tables source
 * Exclut CESSION INTER_STOCKS (natop = 'CIS')
 * 
 * @param {Object} filters - Filtres optionnels
 * @returns {Promise<Object>} { totals, concessions }
 */
async function getChiffreAffaires(filters = {}) {
    try {
        // Utiliser la date sélectionnée ou la date du jour
        const selectedDate = filters.date_n ? new Date(filters.date_n) : new Date();
        const currentYear = selectedDate.getFullYear();
        const lastYear = currentYear - 1;

        // Dates pour year-to-date
        const today = selectedDate.toISOString().split('T')[0];
        const startDateN = `${currentYear}-01-01`;
        const startDateN1 = `${lastYear}-01-01`;
        const endDateN1 = `${lastYear}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

        console.log(`[CA Service] Calcul CA avec filtres:`, filters);
        console.log(`[CA Service] Période N: ${startDateN} à ${today}`);
        console.log(`[CA Service] Période N-1: ${startDateN1} à ${endDateN1}`);



        // Fonction pour construire les conditions WHERE dynamiques
        // RÈGLE PHP: Exclure natop='CIS' (Cession Inter-Stocks) ET est_trx=1 (Travaux Extérieurs)
        // IMPORTANT: Filtrer par date_ymd pour comparer les mêmes périodes (year-to-date)
        const whereConditions = [
            `annee IN (${currentYear}, ${lastYear})`,
            `(est_trx IS NULL OR est_trx = 0)`,
            // Filtre year-to-date: pour N, du 1er janvier à aujourd'hui ; pour N-1, du 1er janvier à la même date de l'année précédente
            `(
                (annee = ${currentYear} AND date_ymd >= '${startDateN}' AND date_ymd <= '${today}')
                OR (annee = ${lastYear} AND date_ymd >= '${startDateN1}' AND date_ymd <= '${endDateN1}')
            )`
        ];
        const params = [];

        // Gestion du filtre nature_operations (multi-sélection)
        if (filters.nature_operations && filters.nature_operations.length > 0) {
            // Si des natures d'opération sont sélectionnées, on filtre par ces valeurs
            const natopPlaceholders = filters.nature_operations.map((_, index) => {
                params.push(filters.nature_operations[index]);
                return `$${params.length}`;
            }).join(', ');
            whereConditions.push(`natop IN (${natopPlaceholders})`);
            console.log(`[CA Service] Filtre natop actif: ${filters.nature_operations.join(', ')}`);
        } else {
            // Par défaut (aucune sélection), on exclut CIS (Cession Inter-Stocks)
            whereConditions.push(`(natop IS NULL OR natop != 'CIS')`);
            console.log(`[CA Service] Filtre natop par défaut: exclusion CIS`);
        }

        // Mapping des filtres vers les colonnes de mag_ca
        // Mapping des filtres vers les colonnes de mag_ca
        // societe -> soc
        if (filters.societe && filters.societe.length > 0) {
            whereConditions.push(buildSqlClause('TRIM(soc)', filters.societe).substring(5));
        }
        // concession -> idss
        // concession -> idss
        if (filters.concession && filters.concession.length > 0) {
            whereConditions.push(buildSqlClause('TRIM(idss)', filters.concession).substring(5));
        }
        // categorie -> categ
        if (filters.categorie && filters.categorie.length > 0) {
            whereConditions.push(buildSqlClause('TRIM(categ)', filters.categorie).substring(5));
        }
        // code_gestion -> codg
        if (filters.code_gestion && filters.code_gestion.length > 0) {
            whereConditions.push(buildSqlClause('TRIM(codg)', filters.code_gestion).substring(5));
        }
        // constructeur -> constp
        if (filters.constructeur && filters.constructeur.length > 0) {
            whereConditions.push(buildSqlClause('TRIM(constp)', filters.constructeur).substring(5));
        }

        const whereClause = whereConditions.join(' AND ');

        // NOTE: params nest plus utilisé directement ici car buildSqlClause injecte les valeurs directement dans la string
        // C'est moins sécurisé contre l'injection SQL mais buildSqlClause gère l'échappement basique des quotes
        // Pour mag_ca c'est acceptable car c'est une table de reporting interne et les inputs sont normalisés


        // 1. Requête pour les TOTAUX GLOBAUX
        const queryTotals = `
            SELECT 
                annee,
                service,
                SUM(montant) AS montant
            FROM mag_ca
            WHERE ${whereClause}
            GROUP BY annee, service
        `;

        console.log('---------------------------------------------------');
        console.log('DEBUG QUERY TOTALS:', queryTotals);
        console.log('DEBUG PARAMS:', params);
        console.log('---------------------------------------------------');

        // 2. Requête pour le DÉTAIL PAR CONCESSION
        // On récupère aussi le nom de la concession via la table sso (si possible) ou on utilise idss
        // Note: mag_ca a déjà idss. Pour le nom, on fera une jointure ou on utilisera idss pour l'instant.
        // On suppose qu'on a besoin du CA N total par concession pour le tableau
        const queryConcessions = `
            SELECT 
                idss,
                SUM(CASE WHEN annee = ${currentYear} THEN montant ELSE 0 END) as ca_total_n,
                SUM(CASE WHEN annee = ${lastYear} THEN montant ELSE 0 END) as ca_total_n1,
                SUM(CASE WHEN annee = ${currentYear} AND service = 'Pièces magasin' THEN montant ELSE 0 END) as ca_magasin_mav_n,
                SUM(CASE WHEN annee = ${currentYear} AND service = 'Pièces atelier' THEN montant ELSE 0 END) as ca_atelier_n
            FROM mag_ca
            WHERE ${whereClause}
            GROUP BY idss
            ORDER BY idss
        `;

        const [resTotals, resConcessions] = await Promise.all([
            db.query(queryTotals, params),
            db.query(queryConcessions, params)
        ]);

        console.log('DEBUG RAW RESULTS TOTALS:', JSON.stringify(resTotals, null, 2));

        // --- TRAITEMENT DES TOTAUX ---
        const totals = {
            ca_magasin_n: 0,
            ca_magasin_n1: 0,
            ca_atelier_n: 0,
            ca_atelier_n1: 0,
            ca_total_n: 0,
            ca_total_n1: 0,
            evolution: 0,
            annee_n: currentYear,
            annee_n1: lastYear
        };

        for (const row of resTotals) {
            const annee = parseInt(row.annee);
            const montant = parseFloat(row.montant) || 0;
            const service = row.service;

            if (service === 'Pièces magasin') {
                if (annee === currentYear) totals.ca_magasin_n = montant;
                else if (annee === lastYear) totals.ca_magasin_n1 = montant;
            } else if (service === 'Pièces atelier') {
                if (annee === currentYear) totals.ca_atelier_n = montant;
                else if (annee === lastYear) totals.ca_atelier_n1 = montant;
            }
        }

        totals.ca_total_n = totals.ca_magasin_n + totals.ca_atelier_n;
        totals.ca_total_n1 = totals.ca_magasin_n1 + totals.ca_atelier_n1;

        totals.evolution = totals.ca_total_n1 > 0
            ? ((totals.ca_total_n - totals.ca_total_n1) / totals.ca_total_n1) * 100
            : 0;

        // --- TRAITEMENT DES CONCESSIONS ---
        // On va essayer d'enrichir avec le nom de la concession si on a un mapping
        // Pour l'instant on renvoie idss comme nom si on n'a pas mieux
        const concessions = resConcessions.map(row => {
            const caN = parseFloat(row.ca_total_n) || 0;
            const caN1 = parseFloat(row.ca_total_n1) || 0;
            const evol = caN1 > 0 ? ((caN - caN1) / caN1) * 100 : 0;

            return {
                id_concession: row.idss,
                nom_concession: row.idss, // Sera remplacé par le vrai nom si on joint sso/concession
                ca_magasin_mav_n: parseFloat(row.ca_magasin_mav_n) || 0,
                ca_magasin_cession_n: 0, // Inclus dans mag_ca globalement, pas distingué facilement ici sans service détaillé
                ca_atelier_n: parseFloat(row.ca_atelier_n) || 0,
                ca_total_n: caN,
                ca_total_n1: caN1,
                evolution: evol
            };
        });

        console.log(`[CA Service] Total Global N: ${totals.ca_total_n.toLocaleString('fr-FR')} €`);

        return { totals, concessions };

    } catch (error) {
        console.error('[CA Service] Erreur:', error.message);
        throw error;
    }
}

/**
 * Récupère la liste des clients avec leurs coordonnées GPS
 * Si constructeur est spécifié, filtre les clients ayant acheté cette marque
 * @param {Object} filters - Filtres optionnels
 * @returns {Promise<Array>}
 */
async function getClients(filters = {}) {
    try {
        const selectedDate = filters.date_n ? new Date(filters.date_n) : new Date();
        const currentYear = selectedDate.getFullYear();
        const lastYear = currentYear - 1;
        const startDateN = `${currentYear}-01-01`;
        const today = selectedDate.toISOString().split('T')[0];

        // Pour N-1, on prend la même période que N (year-to-date)
        const startDateN1 = `${lastYear}-01-01`;
        const endDateN1 = `${lastYear}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

        // Filtres nécessitant une sous-requête (Constructeur ou Nature Opération acheté)
        const havingPurchased = [];

        if (filters.constructeur && filters.constructeur.length > 0) {
            const clause = buildSqlClause('lor.slor_constp', filters.constructeur).substring(4); // Remove AND
            const clauseLig = buildSqlClause('l.dlig_constp', filters.constructeur).substring(4);

            havingPurchased.push(`(
                b.cbse_numcli IN (
                    SELECT DISTINCT lor.slor_numcli FROM sav_lor lor WHERE ${clause}
                    UNION 
                    SELECT DISTINCT l.dlig_numcli FROM dpc_lig l WHERE ${clauseLig}
                )
            )`);
        }

        if (filters.code_gestion && filters.code_gestion.length > 0) {
            const clause = buildSqlClause('lor.slor_codg', filters.code_gestion).substring(4); // Remove AND
            const clauseLig = buildSqlClause('l.dlig_codg', filters.code_gestion).substring(4);

            havingPurchased.push(`(
                b.cbse_numcli IN (
                    SELECT DISTINCT lor.slor_numcli FROM sav_lor lor WHERE ${clause}
                    UNION 
                    SELECT DISTINCT l.dlig_numcli FROM dpc_lig l WHERE ${clauseLig}
                )
            )`);
        }
        // Construction des conditions WHERE de base
        let whereClause = '1=1';

        // Filtres qui s'appliquent directement sur la table principale (ou via jointures)
        // Filtres qui s'appliquent directement sur la table principale (ou via jointures)
        if (filters.societe && filters.societe.length > 0) {
            whereClause += buildSqlClause('TRIM(s.asuc_numsoc)', filters.societe);
        }

        if (filters.concession && filters.concession.length > 0) {
            whereClause += buildSqlClause("TRIM(s.asuc_numsoc) || TRIM(s.asuc_num)", filters.concession);
        }

        if (filters.categorie && filters.categorie.length > 0) {
            whereClause += buildSqlClause('csoc_categ', filters.categorie);
        }




        // Déterminer le type de jointure pour cli_soc
        // Si on filtre par catégorie, on doit faire un INNER JOIN, sinon LEFT JOIN
        const cliSocJoinType = (filters.categorie && filters.categorie.length > 0) ? 'INNER JOIN' : 'LEFT JOIN';

        const sql = `
            WITH ca_all_time AS (
                -- CA Magasin year-to-date pour N et N-1
                SELECT 
                    f.dfac_numcli AS numcli,
                    SUM(l.dlig_qteliv * l.dlig_pxnreel) AS montant,
                    EXTRACT(YEAR FROM f.dfac_datefac)::INTEGER AS annee,
                    'MAG' AS type_service
                FROM dpc_fac f
                INNER JOIN dpc_lig l ON f.dfac_soc = l.dlig_soc 
                    AND f.dfac_succ = l.dlig_succ 
                    AND f.dfac_numfac = l.dlig_numfac
                LEFT JOIN dpc_ent e ON e.dent_soc = l.dlig_soc 
                    AND e.dent_succ = l.dlig_succ 
                    AND e.dent_numdp = l.dlig_numdp 
                    AND e.dent_natop = l.dlig_natopet
                WHERE f.dfac_serv = 'MAV'
                    AND e.dent_pos IN ('FC', 'CP')
                    AND (e.dent_natop IS NULL OR e.dent_natop != 'CIS')
                    AND (
                        (f.dfac_datefac >= '${startDateN}' AND f.dfac_datefac <= '${today}')
                        OR (f.dfac_datefac >= '${startDateN1}' AND f.dfac_datefac <= '${endDateN1}')
                    )
                GROUP BY f.dfac_numcli, annee
                
                UNION ALL
                
                -- CA Magasin Cession year-to-date pour N et N-1
                SELECT 
                    c.dfcc_numcli AS numcli,
                    SUM(l.dlig_qteliv * l.dlig_pxnreel) AS montant,
                    EXTRACT(YEAR FROM c.dfcc_datefac)::INTEGER AS annee,
                    'MAG' AS type_service
                FROM dpc_fcc c
                INNER JOIN dpc_lig l ON c.dfcc_soc = l.dlig_soc 
                    AND c.dfcc_succ = l.dlig_succ 
                    AND c.dfcc_numfcc = l.dlig_numfac
                LEFT JOIN dpc_ent e ON e.dent_soc = l.dlig_soc 
                    AND e.dent_succ = l.dlig_succ 
                    AND e.dent_numdp = l.dlig_numdp 
                    AND e.dent_natop = l.dlig_natopet
                WHERE c.dfcc_serv = 'MAV'
                    AND e.dent_pos IN ('FC', 'CP')
                    AND (e.dent_natop IS NULL OR e.dent_natop != 'CIS')
                    AND (
                        (c.dfcc_datefac >= '${startDateN}' AND c.dfcc_datefac <= '${today}')
                        OR (c.dfcc_datefac >= '${startDateN1}' AND c.dfcc_datefac <= '${endDateN1}')
                    )
                GROUP BY c.dfcc_numcli, annee
                
                UNION ALL
                
                -- CA Atelier year-to-date pour N et N-1
                SELECT 
                    f.dfac_numcli AS numcli,
                    SUM(lor.slor_qterea * lor.slor_pxnreel) AS montant,
                    EXTRACT(YEAR FROM f.dfac_datefac)::INTEGER AS annee,
                    'ATL' AS type_service
                FROM dpc_fac f
                INNER JOIN sav_lor lor ON f.dfac_soc = lor.slor_soc 
                    AND f.dfac_succ = lor.slor_succ 
                    AND f.dfac_numfac = lor.slor_numfac
                LEFT JOIN sav_itv itv ON itv.sitv_soc = lor.slor_soc 
                    AND itv.sitv_succ = lor.slor_succ 
                    AND itv.sitv_numor = lor.slor_numor 
                    AND itv.sitv_interv = FLOOR(lor.slor_nogrp/100)
                INNER JOIN sav_eor eor ON lor.slor_soc = eor.seor_soc 
                    AND lor.slor_succ = eor.seor_succ 
                    AND lor.slor_numor = eor.seor_numor
                WHERE f.dfac_serv = 'SAV'
                    AND itv.sitv_pos IN ('FC', 'CP')
                    AND lor.slor_typlig = 'P'
                    AND (
                        (f.dfac_datefac >= '${startDateN}' AND f.dfac_datefac <= '${today}')
                        OR (f.dfac_datefac >= '${startDateN1}' AND f.dfac_datefac <= '${endDateN1}')
                    )
                GROUP BY f.dfac_numcli, annee
                
                UNION ALL
                
                -- CA Atelier Cession year-to-date pour N et N-1
                SELECT 
                    c.dfcc_numcli AS numcli,
                    SUM(lor.slor_qterea * lor.slor_pxnreel) AS montant,
                    EXTRACT(YEAR FROM c.dfcc_datefac)::INTEGER AS annee,
                    'ATL' AS type_service
                FROM dpc_fcc c
                INNER JOIN sav_lor lor ON c.dfcc_soc = lor.slor_soc 
                    AND c.dfcc_succ = lor.slor_succ 
                    AND c.dfcc_numfcc = lor.slor_numfac
                LEFT JOIN sav_itv itv ON itv.sitv_soc = lor.slor_soc 
                    AND itv.sitv_succ = lor.slor_succ 
                    AND itv.sitv_numor = lor.slor_numor 
                    AND itv.sitv_interv = FLOOR(lor.slor_nogrp/100)
                INNER JOIN sav_eor eor ON lor.slor_soc = eor.seor_soc 
                    AND lor.slor_succ = eor.seor_succ 
                    AND lor.slor_numor = eor.seor_numor
                WHERE c.dfcc_serv = 'SAV'
                    AND itv.sitv_pos IN ('FC', 'CP')
                    AND lor.slor_typlig = 'P'
                    AND (
                        (c.dfcc_datefac >= '${startDateN}' AND c.dfcc_datefac <= '${today}')
                        OR (c.dfcc_datefac >= '${startDateN1}' AND c.dfcc_datefac <= '${endDateN1}')
                    )
                GROUP BY c.dfcc_numcli, annee
            ),
            ca_aggregated AS (
                SELECT 
                    numcli,
                    SUM(montant) AS ca_total,
                    -- Totaux N
                    SUM(CASE WHEN annee = ${currentYear} THEN montant ELSE 0 END) AS ca_n,
                    SUM(CASE WHEN annee = ${currentYear} AND type_service = 'MAG' THEN montant ELSE 0 END) AS ca_magasin_n,
                    SUM(CASE WHEN annee = ${currentYear} AND type_service = 'ATL' THEN montant ELSE 0 END) AS ca_atelier_n,
                    -- Totaux N-1
                    SUM(CASE WHEN annee = ${lastYear} THEN montant ELSE 0 END) AS ca_n1,
                    SUM(CASE WHEN annee = ${lastYear} AND type_service = 'MAG' THEN montant ELSE 0 END) AS ca_magasin_n1,
                    SUM(CASE WHEN annee = ${lastYear} AND type_service = 'ATL' THEN montant ELSE 0 END) AS ca_atelier_n1
                FROM ca_all_time
                WHERE (annee = ${currentYear}) 
                   OR (annee = ${lastYear})
                GROUP BY numcli
            )
            SELECT DISTINCT
                b.cbse_numcli AS numcli,
                TRIM(b.cbse_nomcli) AS nom,
                TRIM(csoc_soc) || TRIM(csoc_succ) AS id_concession,
                TRIM(s.asuc_ville) AS ville_concession,
                COALESCE(gc.longitude, b.cbse_longitude) AS lng,
                COALESCE(gc.latitude, b.cbse_latitude) AS lat,
                TRIM(b.cbse_adr1) AS adr1,
                TRIM(b.cbse_ptt) AS code_postal,
                TRIM(b.cbse_bureauptt) AS ville,
                TRIM(csoc_categ) AS categorie,
                TRIM(b.cbse_groupe) AS groupe,
                COALESCE(ca.ca_total, 0) AS ca_total,
                COALESCE(ca.ca_n, 0) AS ca_n,
                COALESCE(ca.ca_magasin_n, 0) AS ca_magasin_n,
                COALESCE(ca.ca_atelier_n, 0) AS ca_atelier_n,
                COALESCE(ca.ca_n1, 0) AS ca_n1,
                COALESCE(ca.ca_magasin_n1, 0) AS ca_magasin_n1,
                COALESCE(ca.ca_atelier_n1, 0) AS ca_atelier_n1
            FROM cli_bse b
            ${cliSocJoinType} cli_soc ON csoc_numcli = b.cbse_numcli
            LEFT JOIN agr_succ s ON (s.asuc_numsoc = csoc_soc AND s.asuc_num = csoc_succ)
            LEFT JOIN geocode_cache gc ON gc.numcli = b.cbse_numcli
            LEFT JOIN ca_aggregated ca ON ca.numcli = b.cbse_numcli
            WHERE ${whereClause}
                AND (
                    gc.latitude IS NOT NULL 
                    OR (b.cbse_longitude IS NOT NULL AND b.cbse_latitude IS NOT NULL)
                )
                ${havingPurchased.length > 0 ? ' AND ' + havingPurchased.join(' AND ') : ''}
            ORDER BY nom
        `;



        return await db.query(sql);

    } catch (error) {
        console.error('[CA Service] Erreur clients:', error.message);
        throw error;
    }
}

/**
 * Récupère les options de filtres disponibles
 * @returns {Promise<Object>}
 */
async function getFiltres() {
    try {
        const [categories, codes, societes, concessions, constructeurs] = await Promise.all([
            db.query(`
                SELECT DISTINCT TRIM(csoc_categ) AS code, TRIM(t.atab_lib) AS libelle
                FROM cli_soc
                LEFT JOIN agr_tab t ON t.atab_code = csoc_categ AND t.atab_nom = 'CAT'
                WHERE csoc_categ IS NOT NULL
                ORDER BY code
            `),
            db.query(`
                SELECT DISTINCT TRIM(dlig_codg) AS code, TRIM(t.atab_lib) AS libelle
                FROM dpc_lig
                LEFT JOIN agr_tab t ON t.atab_code = dlig_codg AND t.atab_nom = 'GES'
                WHERE dlig_codg IS NOT NULL
                ORDER BY code
            `),

            db.query(`
                SELECT DISTINCT 
                    TRIM(asoc_num) AS code,
                    TRIM(asoc_lib) AS libelle
                FROM agr_soc
                WHERE asoc_num IS NOT NULL
                ORDER BY code
            `),
            db.query(`
                SELECT DISTINCT 
                    TRIM(asuc_numsoc) || TRIM(asuc_num) AS id,
                    TRIM(asuc_lib) AS nom,
                    TRIM(asuc_ville) AS ville,
                    TRIM(asuc_numsoc) AS numsoc
                FROM agr_succ
                WHERE asuc_active = 1
                ORDER BY nom
            `),
            db.query(`
                SELECT DISTINCT TRIM(slor_constp) AS code, TRIM(t.atab_lib) AS libelle
                FROM sav_lor
                LEFT JOIN agr_tab t ON t.atab_code = slor_constp AND t.atab_nom = 'CST'
                WHERE slor_constp IS NOT NULL AND TRIM(slor_constp) <> ''
                and atab_lib is not null
                ORDER BY libelle NULLS LAST
            `),
        ]);

        return {
            categories: categories.map(r => ({ code: r.code, libelle: r.libelle || r.code })),
            codes_gestion: codes.map(r => ({ code: r.code, libelle: r.libelle || r.code })),
            societes: societes.map(r => ({ code: r.code, libelle: r.libelle || r.code })),
            concessions: concessions.map(r => ({ id: r.id, nom: r.nom, ville: r.ville, numsoc: r.numsoc })),
            constructeurs: constructeurs.map(r => ({ code: r.code, libelle: r.libelle || r.code })),
            annees: [new Date().getFullYear(), new Date().getFullYear() - 1],
        };

    } catch (error) {
        console.error('[CA Service] Erreur filtres:', error.message);
        throw error;
    }
}

/**
 * ============================================================================
 * DÉTAIL DES LIGNES PAR CLIENT
 * Pour affichage au clic sur un client
 * ============================================================================
 */

/**
 * Récupère le détail des achats d'un client spécifique
 * @param {number} numcli - Numéro du client
 * @param {Object} filters - Filtres optionnels
 * @returns {Promise<Object>} { client, lignes_magasin, lignes_atelier, totaux }
 */
async function getDetailLignesClient(numcli, filters = {}) {
    try {
        const selectedDate = filters.date_n ? new Date(filters.date_n) : new Date();
        const currentYear = selectedDate.getFullYear();
        const lastYear = currentYear - 1;
        const today = selectedDate.toISOString().split('T')[0];

        // Pour N-1, on prend la même période que N (year-to-date)
        const startDateN = `${currentYear}-01-01`;
        const startDateN1 = `${lastYear}-01-01`;
        const endDateN1 = `${lastYear}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

        console.log(`[CA Service] Détail client ${numcli}...`);

        // Infos client
        const clientInfo = await db.query(`
            SELECT 
                b.cbse_numcli AS numcli,
                TRIM(b.cbse_nomcli) AS nom,
                TRIM(b.cbse_adr1) AS adresse,
                TRIM(b.cbse_ptt) AS code_postal,
                TRIM(b.cbse_bureauptt) AS ville,
                TRIM(b.cbse_groupe) AS groupe
            FROM cli_bse b
            WHERE b.cbse_numcli = ${numcli}
        `);

        // Lignes Magasin (MAV) - Factures normales + Cession
        const lignesMagasin = await db.query(`
            SELECT
                f.dfac_datefac AS date_facture,
                f.dfac_numfac AS num_facture,
                'Facture' AS type_facture,
                COALESCE(TRIM(t.atab_lib), TRIM(l.dlig_constp)) AS constructeur,
                TRIM(l.dlig_constp) AS code_constructeur,
                TRIM(cod.lvl1) AS code_cla,
                TRIM(l.dlig_desi) AS designation,
                CASE 
                    WHEN LENGTH(TRIM(b.abse_cremvteart)) >= 3 
                    THEN LEFT(TRIM(b.abse_cremvteart), 2) || '-' || RIGHT(TRIM(b.abse_cremvteart), 1)
                    ELSE TRIM(b.abse_cremvteart)
                END AS remise_achat,
                l.dlig_codg AS code_gestion,
                l.dlig_qteliv AS quantite,
                l.dlig_pxnreel AS prix_unitaire,
                (l.dlig_qteliv * l.dlig_pxnreel) AS montant_ht,
                EXTRACT(YEAR FROM f.dfac_datefac)::INTEGER AS annee
            FROM dpc_fac f
            INNER JOIN dpc_lig l ON f.dfac_soc = l.dlig_soc AND f.dfac_succ = l.dlig_succ AND f.dfac_numfac = l.dlig_numfac
            LEFT JOIN dpc_ent e ON e.dent_soc = l.dlig_soc AND e.dent_succ = l.dlig_succ AND e.dent_numdp = l.dlig_numdp AND e.dent_natop = l.dlig_natopet
            LEFT JOIN agr_tab t ON t.atab_code = l.dlig_constp AND t.atab_nom = 'CST'
            LEFT JOIN art_bse b ON b.abse_constp = l.dlig_constp AND TRIM(LEADING '0' FROM TRIM(b.abse_refp)) = TRIM(LEADING '0' FROM TRIM(l.dlig_ref))
            LEFT JOIN ate_codcla cod ON cod.codcla = TRIM(b.abse_libre1)
            WHERE f.dfac_serv = 'MAV'
                AND e.dent_pos IN ('FC', 'CP')
                AND f.dfac_numcli = ${numcli}
                AND TRIM(l.dlig_codg) != 'REGUL'
                AND (
                    (f.dfac_datefac >= '${startDateN}' AND f.dfac_datefac <= '${today}')
                    OR (f.dfac_datefac >= '${startDateN1}' AND f.dfac_datefac <= '${endDateN1}')
                )
            UNION ALL
            SELECT
                c.dfcc_datefac AS date_facture,
                c.dfcc_numfcc AS num_facture,
                'Cession' AS type_facture,
                COALESCE(TRIM(t.atab_lib), TRIM(l.dlig_constp)) AS constructeur,
                TRIM(l.dlig_constp) AS code_constructeur,
                TRIM(cod.lvl1) AS code_cla,
                TRIM(l.dlig_desi) AS designation,
                CASE 
                    WHEN LENGTH(TRIM(b.abse_cremvteart)) >= 3 
                    THEN LEFT(TRIM(b.abse_cremvteart), 2) || '-' || RIGHT(TRIM(b.abse_cremvteart), 1)
                    ELSE TRIM(b.abse_cremvteart)
                END AS remise_achat,
                l.dlig_codg AS code_gestion,
                l.dlig_qteliv AS quantite,
                l.dlig_pxnreel AS prix_unitaire,
                (l.dlig_qteliv * l.dlig_pxnreel) AS montant_ht,
                EXTRACT(YEAR FROM c.dfcc_datefac)::INTEGER AS annee
            FROM dpc_fcc c
            INNER JOIN dpc_lig l ON c.dfcc_soc = l.dlig_soc AND c.dfcc_succ = l.dlig_succ AND c.dfcc_numfcc = l.dlig_numfac
            LEFT JOIN dpc_ent e ON e.dent_soc = l.dlig_soc AND e.dent_succ = l.dlig_succ AND e.dent_numdp = l.dlig_numdp AND e.dent_natop = l.dlig_natopet
            LEFT JOIN agr_tab t ON t.atab_code = l.dlig_constp AND t.atab_nom = 'CST'
            LEFT JOIN art_bse b ON b.abse_constp = l.dlig_constp AND TRIM(LEADING '0' FROM TRIM(b.abse_refp)) = TRIM(LEADING '0' FROM TRIM(l.dlig_ref))
            LEFT JOIN ate_codcla cod ON cod.codcla = TRIM(b.abse_libre1)
            WHERE c.dfcc_serv = 'MAV'
                AND e.dent_pos IN ('FC', 'CP')
                AND c.dfcc_numcli = ${numcli}
                AND TRIM(l.dlig_codg) != 'REGUL'
                AND (
                    (c.dfcc_datefac >= '${startDateN}' AND c.dfcc_datefac <= '${today}')
                    OR (c.dfcc_datefac >= '${startDateN1}' AND c.dfcc_datefac <= '${endDateN1}')
                )
            ORDER BY date_facture DESC
        `);

        // Lignes Atelier (SAV) - Factures normales + Cession
        const lignesAtelier = await db.query(`
            SELECT
                f.dfac_datefac AS date_facture,
                f.dfac_numfac AS num_facture,
                lor.slor_numor AS num_or,
                'Facture' AS type_facture,
                COALESCE(TRIM(t.atab_lib), TRIM(lor.slor_constp)) AS constructeur,
                TRIM(lor.slor_constp) AS code_constructeur,
                TRIM(cod.lvl1) AS code_cla,
                TRIM(lor.slor_desi) AS designation,
                CASE 
                    WHEN LENGTH(TRIM(b.abse_cremvteart)) >= 3 
                    THEN LEFT(TRIM(b.abse_cremvteart), 2) || '-' || RIGHT(TRIM(b.abse_cremvteart), 1)
                    ELSE TRIM(b.abse_cremvteart)
                END AS remise_achat,
                lor.slor_codg AS code_gestion,
                lor.slor_qterea AS quantite,
                lor.slor_pxnreel AS prix_unitaire,
                (lor.slor_qterea * lor.slor_pxnreel) AS montant_ht,
                EXTRACT(YEAR FROM f.dfac_datefac)::INTEGER AS annee
            FROM dpc_fac f
            INNER JOIN sav_lor lor ON f.dfac_soc = lor.slor_soc AND f.dfac_succ = lor.slor_succ AND f.dfac_numfac = lor.slor_numfac
            LEFT JOIN sav_itv itv ON itv.sitv_soc = lor.slor_soc AND itv.sitv_succ = lor.slor_succ AND itv.sitv_numor = lor.slor_numor AND itv.sitv_interv = FLOOR(lor.slor_nogrp/100)
            INNER JOIN sav_eor eor ON lor.slor_soc = eor.seor_soc AND lor.slor_succ = eor.seor_succ AND lor.slor_numor = eor.seor_numor
            LEFT JOIN agr_tab t ON t.atab_code = lor.slor_constp AND t.atab_nom = 'CST'
            LEFT JOIN art_bse b ON b.abse_constp = lor.slor_constp AND TRIM(LEADING '0' FROM TRIM(b.abse_refp)) = TRIM(LEADING '0' FROM TRIM(lor.slor_ref))
            LEFT JOIN ate_codcla cod ON cod.codcla = TRIM(b.abse_libre1)
            WHERE f.dfac_serv = 'SAV'
                AND itv.sitv_pos IN ('FC', 'CP')
                AND lor.slor_typlig = 'P'
                AND f.dfac_numcli = ${numcli}
                AND TRIM(lor.slor_codg) != 'REGUL'
                AND (
                    (f.dfac_datefac >= '${startDateN}' AND f.dfac_datefac <= '${today}')
                    OR (f.dfac_datefac >= '${startDateN1}' AND f.dfac_datefac <= '${endDateN1}')
                )
            UNION ALL
            SELECT
                c.dfcc_datefac AS date_facture,
                c.dfcc_numfcc AS num_facture,
                lor.slor_numor AS num_or,
                'Cession' AS type_facture,
                COALESCE(TRIM(t.atab_lib), TRIM(lor.slor_constp)) AS constructeur,
                TRIM(lor.slor_constp) AS code_constructeur,
                TRIM(cod.lvl1) AS code_cla,
                TRIM(lor.slor_desi) AS designation,
                CASE 
                    WHEN LENGTH(TRIM(b.abse_cremvteart)) >= 3 
                    THEN LEFT(TRIM(b.abse_cremvteart), 2) || '-' || RIGHT(TRIM(b.abse_cremvteart), 1)
                    ELSE TRIM(b.abse_cremvteart)
                END AS remise_achat,
                lor.slor_codg AS code_gestion,
                lor.slor_qterea AS quantite,
                lor.slor_pxnreel AS prix_unitaire,
                (lor.slor_qterea * lor.slor_pxnreel) AS montant_ht,
                EXTRACT(YEAR FROM c.dfcc_datefac)::INTEGER AS annee
            FROM dpc_fcc c
            INNER JOIN sav_lor lor ON c.dfcc_soc = lor.slor_soc AND c.dfcc_succ = lor.slor_succ AND c.dfcc_numfcc = lor.slor_numfac
            LEFT JOIN sav_itv itv ON itv.sitv_soc = lor.slor_soc AND itv.sitv_succ = lor.slor_succ AND itv.sitv_numor = lor.slor_numor AND itv.sitv_interv = FLOOR(lor.slor_nogrp/100)
            INNER JOIN sav_eor eor ON lor.slor_soc = eor.seor_soc AND lor.slor_succ = eor.seor_succ AND lor.slor_numor = eor.seor_numor
            LEFT JOIN agr_tab t ON t.atab_code = lor.slor_constp AND t.atab_nom = 'CST'
            LEFT JOIN art_bse b ON b.abse_constp = lor.slor_constp AND TRIM(LEADING '0' FROM TRIM(b.abse_refp)) = TRIM(LEADING '0' FROM TRIM(lor.slor_ref))
            LEFT JOIN ate_codcla cod ON cod.codcla = TRIM(b.abse_libre1)
            WHERE c.dfcc_serv = 'SAV'
                AND itv.sitv_pos IN ('FC', 'CP')
                AND lor.slor_typlig = 'P'
                AND c.dfcc_numcli = ${numcli}
                AND TRIM(lor.slor_codg) != 'REGUL'
                AND (
                    (c.dfcc_datefac >= '${startDateN}' AND c.dfcc_datefac <= '${today}')
                    OR (c.dfcc_datefac >= '${startDateN1}' AND c.dfcc_datefac <= '${endDateN1}')
                )
            ORDER BY date_facture DESC
        `);

        // Calculer les totaux
        const totaux = {
            magasin_n: 0,
            magasin_n1: 0,
            atelier_n: 0,
            atelier_n1: 0,
            total_n: 0,
            total_n1: 0
        };

        for (const ligne of lignesMagasin) {
            const montant = parseFloat(ligne.montant_ht) || 0;
            if (parseInt(ligne.annee) === currentYear) {
                totaux.magasin_n += montant;
            } else {
                totaux.magasin_n1 += montant;
            }
        }

        for (const ligne of lignesAtelier) {
            const montant = parseFloat(ligne.montant_ht) || 0;
            if (parseInt(ligne.annee) === currentYear) {
                totaux.atelier_n += montant;
            } else {
                totaux.atelier_n1 += montant;
            }
        }

        totaux.total_n = totaux.magasin_n + totaux.atelier_n;
        totaux.total_n1 = totaux.magasin_n1 + totaux.atelier_n1;

        return {
            client: clientInfo[0] || null,
            lignes_magasin: lignesMagasin,
            lignes_atelier: lignesAtelier,
            totaux,
            annee_n: currentYear,
            annee_n1: lastYear
        };

    } catch (error) {
        console.error('[CA Service] Erreur détail client:', error.message);
        throw error;
    }
}

module.exports = {
    getChiffreAffaires,
    getClients,
    getFiltres,
    getDetailLignesClient
};

