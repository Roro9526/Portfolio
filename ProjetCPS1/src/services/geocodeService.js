/**
 * Service de géocodage utilisant OpenStreetMap Nominatim
 * Convertit les adresses en coordonnées GPS
 */

// Cache pour éviter de refaire les mêmes requêtes
const geocodeCache = new Map();

/**
 * Géocode une adresse en utilisant l'API Nominatim
 * @param {string} address - Adresse à géocoder
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
async function geocodeAddress(address) {
    if (!address || address.trim().length < 5) {
        return null;
    }

    // Vérifier le cache
    const cacheKey = address.toLowerCase().trim();
    if (geocodeCache.has(cacheKey)) {
        return geocodeCache.get(cacheKey);
    }

    try {
        const encodedAddress = encodeURIComponent(address);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&countrycodes=fr&limit=1`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'DashboardCA/1.0'
            }
        });

        if (!response.ok) {
            console.warn('[Geocode] Erreur HTTP:', response.status);
            return null;
        }

        const data = await response.json();

        if (data && data.length > 0) {
            const result = {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
            geocodeCache.set(cacheKey, result);
            return result;
        }

        geocodeCache.set(cacheKey, null);
        return null;

    } catch (error) {
        console.error('[Geocode] Erreur:', error.message);
        return null;
    }
}

/**
 * Géocode un lot d'adresses (avec rate limiting pour respecter Nominatim)
 * @param {Array<{address: string, id: any}>} items - Liste d'éléments avec adresses
 * @param {number} delayMs - Délai entre chaque requête (par défaut 1000ms pour Nominatim)
 * @returns {Promise<Map<any, {lat: number, lng: number}>>}
 */
async function geocodeBatch(items, delayMs = 1100) {
    const results = new Map();

    for (const item of items) {
        const coords = await geocodeAddress(item.address);
        if (coords) {
            results.set(item.id, coords);
        }
        // Rate limiting - Nominatim demande max 1 req/sec
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    return results;
}

/**
 * Construit une adresse complète à partir des champs de la base
 */
function buildAddress(adr1, adr2, ptt, ville) {
    const parts = [];

    if (adr1 && adr1.trim()) parts.push(adr1.trim());
    if (adr2 && adr2.trim()) parts.push(adr2.trim());
    if (ptt && ptt.trim()) parts.push(ptt.trim());
    if (ville && ville.trim()) parts.push(ville.trim());

    parts.push('France');

    return parts.join(', ');
}

module.exports = {
    geocodeAddress,
    geocodeBatch,
    buildAddress,
    geocodeCache
};
