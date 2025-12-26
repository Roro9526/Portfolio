/**
 * Dashboard CA - Application JavaScript
 * Gère les appels API, l'affichage des KPIs, le tableau et la carte Leaflet
 */

// Configuration
const API_BASE = '';

// --- GLOBAL MOBILE FUNCTION (Defined immediately) ---
window.toggleMenuDirect = function () {
    const s = document.querySelector('.sidebar');
    const b = document.getElementById('mobile-backdrop');
    if (s) s.classList.toggle('open');
    if (b) b.classList.toggle('active');
};

// État global
let caData = [];
let clientsData = [];
let map = null;
let markersLayer = null;
let filtersActive = false;
let selectedClients = new Set(); // Ensemble des IDs de clients sélectionnés
let clientMarkers = new Map(); // Map des marqueurs par client ID
let initialKPIs = null; // Sauvegarde des totaux globaux
let tomSelectInstances = {}; // Stockage des instances Tom Select

// ===================================
// Fonctions utilitaires
// ===================================
/**
 * Récupère les valeurs d'un filtre (support Tom Select)
 */
function getValues(id) {
    if (tomSelectInstances[id]) {
        return tomSelectInstances[id].getValue();
    }
    const el = document.getElementById(id);
    return el ? el.value : '';
}

// ===================================
// Initialisation
// ===================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Dashboard CA - Initialisation');

    // Vérifier le statut de l'API
    await checkApiStatus();

    // Charger les filtres
    await loadFilters();

    // Charger les données (KPIs)
    await loadData();

    // Initialiser la carte
    initMap();

    // Charger les clients pour la carte (INSTANTANÉ depuis geocode_cache)
    await loadClients();

    // Initialiser le sélecteur de date
    initDateSelector();

    // Event listeners
    setupEventListeners();
});

// ===================================
// API Status
// ===================================
async function checkApiStatus() {
    const statusEl = document.getElementById('api-status');
    const dotEl = statusEl.querySelector('.status-dot');
    const textEl = statusEl.querySelector('.status-text');

    try {
        const response = await fetch(`${API_BASE}/api/status`);
        const data = await response.json();

        if (data.database === 'connected') {
            dotEl.classList.add('connected');
            textEl.textContent = 'Connecté à IRIUM';
        } else {
            dotEl.classList.remove('connected', 'error');
            textEl.textContent = data.database;
        }
    } catch (error) {
        dotEl.classList.add('error');
        textEl.textContent = 'API indisponible';
        console.error('API Status error:', error);
    }
}

// ===================================
// Chargement des données CA
// ===================================
async function loadData(filters = {}) {
    try {
        // Construire l'URL avec les filtres
        // Construction de l'URL avec paramètres multiples
        const params = new URLSearchParams();

        for (const [key, value] of Object.entries(filters)) {
            if (Array.isArray(value)) {
                value.forEach(v => params.append(key, v));
            } else if (value) {
                params.append(key, value);
            }
        }

        const url = `${API_BASE}/api/chiffre-affaires?${params.toString()}`;
        const response = await fetch(url);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Erreur inconnue');
        }

        caData = result.data;
        initialKPIs = result.totaux; // Sauvegarde pour restauration après désélection

        // Mettre à jour les KPIs
        updateKPIs(result.totaux, result.annee_n, result.annee_n1);

        // Mettre à jour l'info
        document.getElementById('data-info').textContent =
            `Année ${result.annee_n} vs ${result.annee_n1}`;

        // Déterminer si des filtres sont actifs
        filtersActive = Object.values(filters).some(v => v);

    } catch (error) {
        console.error('Erreur chargement CA:', error);
    }
}

// ===================================
// Mise à jour des KPIs
// ===================================
function updateKPIs(totaux, anneeN, anneeN1) {
    // ===== Fonction utilitaire =====
    const formatMillion = (val) => {
        if (val >= 1_000_000) {
            return (Math.round((val / 1_000_000) * 10) / 10) + "M€";
        }
        return formatCurrency(val || 0);
    };

    // ===== Magasin =====
    document.getElementById('kpi-mav-n').textContent = formatMillion(totaux.ca_magasin_n);
    document.getElementById('kpi-mav-n1').textContent = `N-1: ${formatMillion(totaux.ca_magasin_n1)}`;

    // ===== Atelier =====
    document.getElementById('kpi-atelier-n').textContent = formatMillion(totaux.ca_atelier_n);
    document.getElementById('kpi-atelier-n1').textContent = `N-1: ${formatMillion(totaux.ca_atelier_n1)}`;

    // ===== Total =====
    document.getElementById('kpi-total-n').textContent = formatMillion(totaux.ca_total_n);
    document.getElementById('kpi-total-n1').textContent = formatMillion(totaux.ca_total_n1);


    // Evolution
    const evolution = parseFloat(totaux.evolution) || 0;
    const evolutionEl = document.getElementById('kpi-evolution');
    evolutionEl.textContent = `${evolution >= 0 ? '+' : ''}${evolution.toFixed(2)}%`;
    evolutionEl.className = 'kpi-value ' + (evolution >= 0 ? 'positive' : 'negative');
}

// ===================================
// Chargement des filtres
// ===================================

// ===================================
// Chargement des filtres
// ===================================
async function loadFilters() {
    try {
        const response = await fetch(`${API_BASE}/api/filtres`);
        const result = await response.json();

        if (!result.success) return;

        const filtres = result.data;

        // Initialiser les instances Tom Select si pas encore fait
        const filterIds = ['filter-societe', 'filter-concession', 'filter-categorie', 'filter-code-gestion', 'filter-constructeur', 'filter-nature-operation'];

        filterIds.forEach(id => {
            if (!tomSelectInstances[id]) {
                const el = document.getElementById(id);
                if (el) {
                    tomSelectInstances[id] = new TomSelect(el, {
                        plugins: ['remove_button', 'checkbox_options'],
                        maxOptions: null,
                        create: false,
                        placeholder: el.getAttribute('placeholder'),
                        render: {
                            option: function (data, escape) {
                                return '<div>' + escape(data.text) + '</div>';
                            },
                            item: function (data, escape) {
                                return '<div>' + escape(data.text) + '</div>';
                            }
                        }
                    });
                }
            }
        });

        // Populate societes
        populateSelect('filter-societe', filtres.societes.map(s => ({
            value: s.code,
            text: s.libelle || s.code
        })));

        // Populate concessions (sites) - initially all
        window.allConcessions = filtres.concessions; // Store for filtering
        populateSelect('filter-concession', filtres.concessions.map(c => ({
            value: c.id,
            text: c.nom
        })));

        // Listen to societe changes to filter sites
        if (tomSelectInstances['filter-societe']) {
            tomSelectInstances['filter-societe'].on('change', function () {
                const selectedSocietes = this.getValue();
                filterConcessionsBySociete(selectedSocietes);
            });
        }

        populateSelect('filter-categorie', filtres.categories.map(c => ({
            value: c.code,
            text: c.libelle || c.code
        })));

        populateSelect('filter-code-gestion', filtres.codes_gestion.map(c => ({
            value: c.code,
            text: c.libelle || c.code
        })));



        // Constructeurs / Marques
        populateSelect('filter-constructeur', filtres.constructeurs.map(c => ({
            value: c.code,
            text: c.libelle || c.code
        })));

        // Nature d'opération - options fixes
        populateSelect('filter-nature-operation', [
            { value: 'ASR', text: 'Avoir sans retour de pièce' },
            { value: 'CES', text: 'Cession' },
            { value: 'CIS', text: 'Cession inter stocks' },
            { value: 'GAR', text: 'Garantie' },
            { value: 'VTE', text: 'Vente' }
        ]);

    } catch (error) {
        console.error('Erreur chargement filtres:', error);
    }
}

function populateSelect(selectId, options) {
    const ts = tomSelectInstances[selectId];
    if (ts) {
        ts.clear();
        ts.clearOptions();
        ts.addOption(options);
        ts.refreshOptions(false);
    }
}

function filterConcessionsBySociete(selectedSocietes) {
    if (!window.allConcessions) return;

    let filteredConcessions = window.allConcessions;

    // If societes are selected, filter concessions
    if (selectedSocietes && selectedSocietes.length > 0) {
        filteredConcessions = window.allConcessions.filter(c =>
            selectedSocietes.includes(c.numsoc)
        );
    }

    // Update concessions dropdown
    populateSelect('filter-concession', filteredConcessions.map(c => ({
        value: c.id,
        text: c.nom
    })));
}

// ===================================
// Carte Leaflet - CHARGEMENT INSTANTANÉ
// ===================================
function initMap() {
    const franceLat = 46.603354;
    const franceLng = 1.888334;

    map = L.map('map', {
        center: [franceLat, franceLng],
        zoom: 6,
        zoomControl: true
    });

    // Tile layer - Style sombre
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);
}

/**
 * Charge les clients - INSTANTANÉ depuis le cache PostgreSQL
 * Plus de géocodage côté client !
 */
async function loadClients(filters = {}) {
    try {
        const params = new URLSearchParams();

        for (const [key, value] of Object.entries(filters)) {
            if (Array.isArray(value)) {
                value.forEach(v => params.append(key, v));
            } else if (value) {
                params.append(key, value);
            }
        }

        const url = `${API_BASE}/api/clients?${params.toString()}`;
        const response = await fetch(url);
        const result = await response.json();

        if (!result.success) return;

        clientsData = result.data;

        // Appliquer le filtre CA > 0
        const filteredClients = filterClientsByCA(clientsData);
        const clientsWithCoords = filteredClients.filter(c => c.lat && c.lng);

        // Mettre à jour le compteur
        document.getElementById('client-count').textContent = `${clientsWithCoords.length} clients`;

        // Afficher TOUS les marqueurs immédiatement
        renderMarkers(clientsWithCoords);

    } catch (error) {
        console.error('Erreur chargement clients:', error);
    }
}

/**
 * Affiche les marqueurs sur la carte - INSTANTANÉ avec code couleur CA
 */
function renderMarkers(clients) {
    if (!markersLayer) return;
    markersLayer.clearLayers();
    clientMarkers.clear();

    clients.forEach(client => {
        // Déterminer la couleur basée sur le CA TOTAL (depuis toujours)
        const caColors = getCAColor(client.ca_total);
        const isSelected = selectedClients.has(client.numcli);

        const marker = L.circleMarker([client.lat, client.lng], {
            radius: 8,
            fillColor: caColors.fill,
            color: isSelected ? '#fbbf24' : caColors.stroke,
            weight: isSelected ? 3 : 2,
            opacity: 0.9,
            fillOpacity: 0.7,
            className: caColors.className + (isSelected ? ' marker-selected' : '')
        });

        const address = [client.adr1, client.code_postal, client.ville].filter(Boolean).join(', ');
        const caTotal = formatCurrency(client.ca_total || 0);

        // Contenu popup allégé selon demande utilisateur
        marker.bindPopup(`
            <div class="client-popup">
                <h4>${client.nom || 'Client'}</h4>
                <p><strong>N° Client:</strong> ${client.numcli}</p>
                <hr style="margin: 8px 0; border: none; border-top: 1px solid rgba(255,255,255,0.1);">
                <p><strong>Adresse:</strong> ${address || '-'}</p>
            </div>
        `);

        // Ajouter l'événement de clic pour la sélection (multi-sélection)
        marker.on('click', () => toggleClientSelection(client));

        markersLayer.addLayer(marker);
        clientMarkers.set(client.numcli, { marker, client });
    });
}

/**
 * Détermine la couleur du cercle basée sur le CA
 */
function getCAColor(ca) {
    const caValue = parseFloat(ca) || 0;

    if (caValue === 0) {
        return { fill: '#8b5cf6', stroke: '#7c3aed', className: 'marker-zero' }; // Violet - CA = 0€
    } else if (caValue >= 100000) {
        return { fill: '#dc2626', stroke: '#b91c1c', className: 'marker-very-high' }; // Rouge - > 100k€
    } else if (caValue >= 25000) {
        return { fill: '#f97316', stroke: '#ea580c', className: 'marker-high' }; // Orange - 25k-100k€
    } else if (caValue >= 10000) {
        return { fill: '#eab308', stroke: '#ca8a04', className: 'marker-medium-high' }; // Jaune - 10k-25k€
    } else if (caValue >= 5000) {
        return { fill: '#22c55e', stroke: '#16a34a', className: 'marker-medium' }; // Vert - 5k-10k€
    } else if (caValue >= 1000) {
        return { fill: '#38bdf8', stroke: '#0ea5e9', className: 'marker-low' }; // Bleu clair/Sky - 1k-5k€
    } else {
        return { fill: '#1e40af', stroke: '#1e3a8a', className: 'marker-very-low' }; // Bleu marine/Navy - 0-1k€
    }
}

/**
 * Bascule la sélection d'un client
 */
function toggleClientSelection(client) {
    const isSelected = !selectedClients.has(client.numcli);

    if (isSelected) {
        selectedClients.add(client.numcli);
    } else {
        selectedClients.delete(client.numcli);
    }

    updateSelectedClientsTable();
    updateMarkerStyles();

    // Mettre à jour les KPIs globaux en fonction de la sélection
    updateKPIsFromSelection();
}

/**
 * Filtre les clients avec CA > 0 (permanent)
 */
function filterClientsByCA(clients) {
    // Filtrer uniquement les clients avec CA > 0 (permanent)
    return clients.filter(client => parseFloat(client.ca_total) > 0);
}

/**
 * Met à jour les styles des marqueurs (sélectionnés vs non-sélectionnés)
 */
function updateMarkerStyles() {
    clientMarkers.forEach((data, numcli) => {
        const { marker, client } = data;
        const isSelected = selectedClients.has(numcli);
        const caColors = getCAColor(client.ca_total);

        marker.setStyle({
            color: isSelected ? '#fbbf24' : caColors.stroke,
            weight: isSelected ? 3 : 2
        });
    });
}

/**
 * Met à jour le tableau des clients sélectionnés
 */
function updateSelectedClientsTable() {
    const section = document.getElementById('selected-clients-section');
    const tbody = document.getElementById('selected-clients-body');
    const countEl = document.getElementById('selected-count');

    if (selectedClients.size === 0) {
        section.classList.add('hidden');
        tbody.innerHTML = '';
        return;
    }

    section.classList.remove('hidden');
    countEl.textContent = `${selectedClients.size} client${selectedClients.size > 1 ? 's' : ''}`;

    const selectedData = Array.from(selectedClients)
        .map(numcli => clientMarkers.get(numcli)?.client)
        .filter(Boolean);

    tbody.innerHTML = selectedData.map(client => `
        <tr>
            <td>${client.nom || '-'}</td>
            <td>${client.numcli}</td>
            <td class="num">${formatCurrencyShort(client.ca_total || 0)}</td>
            <td>${client.ville_concession || client.id_concession || '-'}</td>
            <td style="text-align: center;">
                <button class="btn-small" onclick="window.open('client_detail.html?numcli=${client.numcli}&date_n=${getValues('date-n')}', '_blank', 'width=1000,height=800')">
                    Voir détail
                </button>
            </td>
            <td style="text-align: center;">
                <button class="btn-delete" data-numcli="${client.numcli}">
                    ✕
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Retire un client de la sélection
 */
function removeClientSelection(numcli) {
    selectedClients.delete(numcli);
    updateSelectedClientsTable();
    updateMarkerStyles();
    // Mettre à jour aussi les KPIs
    updateKPIsFromSelection();
}

// Rendre la fonction accessible globalement pour onclick
window.removeClient = removeClientSelection;

/**
 * Efface toute la sélection
 */
function clearSelection() {
    selectedClients.clear();
    updateSelectedClientsTable();
    updateMarkerStyles();
    updateKPIsFromSelection();
}

/**
 * Recalcule les KPIs globaux en fonction des clients sélectionnés
 */
function updateKPIsFromSelection() {
    // Si aucune sélection, restaurer les valeurs initiales
    if (selectedClients.size === 0) {
        if (initialKPIs) {
            updateKPIs(initialKPIs);
        }
        return;
    }

    // Calculer la somme des clients sélectionnés
    const sum = {
        ca_magasin_n: 0,
        ca_magasin_n1: 0,
        ca_atelier_n: 0,
        ca_atelier_n1: 0,
        ca_total_n: 0,
        ca_total_n1: 0,
        evolution: 0
    };

    selectedClients.forEach(numcli => {
        const client = clientMarkers.get(numcli)?.client;
        if (client) {
            sum.ca_magasin_n += parseFloat(client.ca_magasin_n || 0);
            sum.ca_magasin_n1 += parseFloat(client.ca_magasin_n1 || 0);
            sum.ca_atelier_n += parseFloat(client.ca_atelier_n || 0);
            sum.ca_atelier_n1 += parseFloat(client.ca_atelier_n1 || 0);
            sum.ca_total_n += parseFloat(client.ca_n || 0);
            sum.ca_total_n1 += parseFloat(client.ca_n1 || 0);
        }
    });

    // Calcul évolution
    if (sum.ca_total_n1 > 0) {
        sum.evolution = ((sum.ca_total_n - sum.ca_total_n1) / sum.ca_total_n1) * 100;
    } else if (sum.ca_total_n > 0) {
        sum.evolution = 100;
    }

    updateKPIs(sum);
}



/**
 * Formate une date au format DD/MM/YYYY
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')
        }/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

// ===================================
// Event Listeners
// ===================================
function setupEventListeners() {
    document.getElementById('btn-apply-filters').addEventListener('click', applyFilters);
    document.getElementById('btn-reset-filters').addEventListener('click', resetFilters);
    document.getElementById('btn-clear-selection').addEventListener('click', clearSelection);
    // document.getElementById('btn-close-detail').addEventListener('click', closeClientDetail); // Fonction inexistante


    // Event delegation permanent pour les boutons delete du tableau
    const tbody = document.getElementById('selected-clients-body');
    if (tbody) {
        tbody.addEventListener('click', (e) => {
            console.log('📍 Click dans tbody:', e.target);
            const deleteBtn = e.target.closest('.btn-delete');
            console.log('📍 Bouton trouvé:', deleteBtn);
            if (deleteBtn) {
                e.preventDefault();
                e.stopPropagation();
                const numcli = deleteBtn.getAttribute('data-numcli');
                console.log('✕ Suppression client:', numcli);
                if (numcli) {
                    // Important : convertir en nombre car le Set contient des nombres
                    removeClientSelection(parseInt(numcli, 10));
                }
            }
        });
    } else {
        console.error('❌ selected-clients-body NOT FOUND');
    }


    // --- MOBILE MENU EVENTS ---
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.getElementById('mobile-backdrop');

    console.log('📱 Mobile Init:', { mobileBtn, sidebar, backdrop });

    function toggleMenu(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        console.log('📱 Toggle Menu Clicked (Listener)');
        sidebar.classList.toggle('open');
        backdrop.classList.toggle('active');
        console.log('📱 Sidebar classes:', sidebar.className);
    }

    if (mobileBtn) {
        // Remove old listeners if any by cloning (optional but safe) or just add
        // mobileBtn.addEventListener('click', toggleMenu); // DISABLED IN FAVOR OF INLINE
        console.log('📱 Event listener attached to mobile button (check inline)');
    } else {
        console.error('❌ Mobile button NOT FOUND');
    }
    if (backdrop) {
        backdrop.addEventListener('click', closeMenu);
    }


}


function applyFilters() {
    const filters = {
        societe: getValues('filter-societe'),
        concession: getValues('filter-concession'),
        categorie: getValues('filter-categorie'),
        code_gestion: getValues('filter-code-gestion'),
        constructeur: getValues('filter-constructeur'),
        nature_operations: getValues('filter-nature-operation')
    };

    console.log('Filtres appliqués:', filters);

    // Auto-close menu on mobile
    if (window.innerWidth <= 768) {
        const s = document.querySelector('.sidebar');
        const b = document.getElementById('mobile-backdrop');
        if (s) s.classList.remove('open');
        if (b) b.classList.remove('active');
    }

    // Recharger les données
    loadData(filters);
    loadClients(filters);
}

function resetFilters() {
    // Reset Tom Selects
    Object.values(tomSelectInstances).forEach(ts => ts.clear());

    applyFilters();
}

// ===================================
// Utilitaires de formatage
// ===================================
function formatCurrency(value) {
    const num = parseFloat(value) || 0;
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
}

function formatCurrencyShort(value) {
    const num = parseFloat(value) || 0;
    // Si très grand nombre dans le tableau, on peut garder le format court, ou tout mettre en format complet ?
    // Le client veut "toutes les données comme demandé", donc précision.
    // Cependant pour le tableau "M€/K€" est peut-être mieux pour la lisibilité
    // MAIS pour les KPIs le user veut voir les centimes.
    // formatCurrencyShort est utilisé dans le tableau et pour les petits labels N-1 KPIs.

    // On va modifier pour utiliser formatCurrency (complet) partout sauf si vraiment nécessaire ?
    // Pour l'instant gardons le short pour le tableau si c > 1M, mais avec 2 decimales aussi

    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + ' M€';
    } else if (num >= 1000) {
        // Enlever le format K€ pour être plus précis dans le tableau aussi ?
        // Le user a dit "tout ca proprement".
        // Essayons d'être propre : full format pour tout ce qui < 1M, et M€ avec 2 decimales
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(num);
    }
    return formatCurrency(num);
}

function formatPercent(value) {
    const num = parseFloat(value) || 0;
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}% `;
}

// ===================================
// Gestion du sélecteur de date
// ===================================
function initDateSelector() {
    const dateInput = document.getElementById('date-n');
    if (!dateInput) return;

    // Initialiser avec la date d'aujourd'hui
    const today = new Date();
    dateInput.valueAsDate = today;

    // Écouter les changements de date
    dateInput.addEventListener('change', async function () {
        console.log('📅 Nouvelle date sélectionnée:', this.value);

        // Recharger les données avec la nouvelle date
        const currentFilters = {
            societe: getValues('filter-societe'),
            concession: getValues('filter-concession'),
            categorie: getValues('filter-categorie'),
            code_gestion: getValues('filter-code-gestion'),
            constructeur: getValues('filter-constructeur'),
            nature_operations: getValues('filter-nature-operation'),
            date_n: this.value // Ajouter la date sélectionnée
        };

        await loadData(currentFilters);
        await loadClients(currentFilters);
    });
}

function trimText(text) {
    return text ? text.trim() : '';
}
