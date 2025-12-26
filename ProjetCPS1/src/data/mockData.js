/**
 * Données mock pour le développement sans connexion BDD
 * Ces données simulent les résultats des requêtes SQL
 */

// Concessions avec leurs informations
const concessions = [
    { id: '0101', soc: '01', succ: '01', nom: 'LYON CENTRE', ville: 'Lyon', lat: 45.764043, lng: 4.835659 },
    { id: '0102', soc: '01', succ: '02', nom: 'LYON NORD', ville: 'Vénissieux', lat: 45.6975, lng: 4.8864 },
    { id: '0201', soc: '02', succ: '01', nom: 'MARSEILLE PORT', ville: 'Marseille', lat: 43.296482, lng: 5.36978 },
    { id: '0202', soc: '02', succ: '02', nom: 'AIX EN PROVENCE', ville: 'Aix-en-Provence', lat: 43.529742, lng: 5.447427 },
    { id: '0301', soc: '03', succ: '01', nom: 'PARIS EST', ville: 'Paris', lat: 48.856614, lng: 2.352222 },
    { id: '0302', soc: '03', succ: '02', nom: 'PARIS NORD', ville: 'Saint-Denis', lat: 48.936181, lng: 2.357443 },
    { id: '0401', soc: '04', succ: '01', nom: 'BORDEAUX CENTRE', ville: 'Bordeaux', lat: 44.837789, lng: -0.57918 },
    { id: '0501', soc: '05', succ: '01', nom: 'TOULOUSE SUD', ville: 'Toulouse', lat: 43.604652, lng: 1.444209 },
    { id: '0601', soc: '06', succ: '01', nom: 'NANTES ATLANTIQUE', ville: 'Nantes', lat: 47.218371, lng: -1.553621 },
    { id: '0701', soc: '07', succ: '01', nom: 'STRASBOURG', ville: 'Strasbourg', lat: 48.573405, lng: 7.752111 },
    { id: '0801', soc: '08', succ: '01', nom: 'LILLE EUROPE', ville: 'Lille', lat: 50.62925, lng: 3.057256 },
    { id: '0901', soc: '09', succ: '01', nom: 'NICE COTE AZUR', ville: 'Nice', lat: 43.710173, lng: 7.261953 },
];

// CA par concession (année N = 2025, N-1 = 2024)
const chiffreAffaires = concessions.map(c => {
    const caBase = Math.floor(Math.random() * 2000000) + 500000;
    const variation = (Math.random() - 0.5) * 0.3; // ±15%

    return {
        id_concession: c.id,
        soc: c.soc,
        succ: c.succ,
        nom_concession: c.nom,
        ville: c.ville,
        // CA Année N (2025)
        ca_magasin_mav_n: Math.floor(caBase * 0.4),
        ca_magasin_cession_n: Math.floor(caBase * 0.2),
        ca_atelier_n: Math.floor(caBase * 0.4),
        ca_total_n: caBase,
        // CA Année N-1 (2024)
        ca_magasin_mav_n1: Math.floor(caBase * 0.4 * (1 + variation)),
        ca_magasin_cession_n1: Math.floor(caBase * 0.2 * (1 + variation)),
        ca_atelier_n1: Math.floor(caBase * 0.4 * (1 + variation)),
        ca_total_n1: Math.floor(caBase * (1 + variation)),
    };
});

// Calculer évolution pour chaque ligne
chiffreAffaires.forEach(ca => {
    ca.evolution = ca.ca_total_n1 !== 0
        ? ((ca.ca_total_n - ca.ca_total_n1) / ca.ca_total_n1 * 100).toFixed(2)
        : 0;
});

// Clients avec leurs localisations
const clients = [];
concessions.forEach(c => {
    const nbClients = Math.floor(Math.random() * 20) + 5;
    for (let i = 0; i < nbClients; i++) {
        clients.push({
            numcli: 10000 + clients.length,
            nom: `Client ${clients.length + 1}`,
            id_concession: c.id,
            concession_nom: c.nom,
            ville: c.ville,
            lat: c.lat + (Math.random() - 0.5) * 0.5,
            lng: c.lng + (Math.random() - 0.5) * 0.5,
            categorie: ['PRO', 'PARTICULIER', 'FLOTTE', 'GARAGE'][Math.floor(Math.random() * 4)],
            code_gestion: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
            groupe: ['GR1', 'GR2', 'GR3'][Math.floor(Math.random() * 3)],
        });
    }
});

// Options de filtres
const filtres = {
    categories: ['PRO', 'PARTICULIER', 'FLOTTE', 'GARAGE'],
    codes_gestion: ['A', 'B', 'C', 'D', 'E'],
    groupes: ['GR1', 'GR2', 'GR3', 'GR4'],
    concessions: concessions.map(c => ({ id: c.id, nom: c.nom, ville: c.ville })),
    annees: [2025, 2024, 2023],
};

module.exports = {
    concessions,
    chiffreAffaires,
    clients,
    filtres
};
