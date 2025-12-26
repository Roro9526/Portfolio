// Simple cache to avoid hitting API limits
const priceCache = {
    data: {},
    timestamp: 0,
    duration: 60000 // 1 minute cache
};

export const fetchCryptoPrice = async (symbol) => {
    try {
        // Check cache first
        const now = Date.now();
        if (priceCache.data[symbol] && (now - priceCache.timestamp < priceCache.duration)) {
            return priceCache.data[symbol];
        }

        // CoinGecko requires full names or specific IDs (e.g., 'bitcoin' for BTC). 
        // For this demo, we'll try to search for the coin first if we only have a symbol.
        // This is a simplified approach. In a real app, we'd map symbols to IDs.

        // 1. Search for the coin to get the ID
        const searchRes = await fetch(`https://api.coingecko.com/api/v3/search?query=${symbol}`);
        const searchData = await searchRes.json();

        if (!searchData.coins || searchData.coins.length === 0) {
            throw new Error("Coin not found");
        }

        // Take the first exact match or the first result
        const coin = searchData.coins.find(c => c.symbol.toLowerCase() === symbol.toLowerCase()) || searchData.coins[0];
        const coinId = coin.id;

        // 2. Fetch price
        const priceRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
        const priceData = await priceRes.json();

        const price = priceData[coinId]?.usd;

        if (price) {
            // Update cache
            priceCache.data[symbol] = price;
            priceCache.timestamp = now;
            return price;
        }

        return null;
    } catch (error) {
        console.error("Error fetching price:", error);
        return null;
    }
};
