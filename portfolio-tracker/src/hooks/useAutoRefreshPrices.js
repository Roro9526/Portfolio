import { useEffect } from 'react';
import { fetchCryptoPrice } from '../lib/priceService';

export const useAutoRefreshPrices = (assets, updateAsset) => {
    useEffect(() => {
        const updatePrices = async () => {
            console.log('Updating crypto prices...');

            for (const asset of assets) {
                // Only update crypto assets
                if (asset.type === 'crypto' || !asset.type) {
                    try {
                        const newPrice = await fetchCryptoPrice(asset.symbol);
                        if (newPrice && newPrice !== asset.currentPrice) {
                            console.log(`Updated ${asset.symbol}: ${newPrice}`);
                            updateAsset(asset.id, { currentPrice: newPrice });
                        }
                    } catch (error) {
                        console.error(`Failed to update ${asset.symbol}:`, error);
                    }
                    // Small delay to avoid API rate limits
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        };

        // Update prices on mount
        if (assets.length > 0) {
            updatePrices();
        }

        // Update prices every 5 minutes
        const interval = setInterval(updatePrices, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(interval);
    }, [assets.length]); // Only re-run if number of assets changes
};
