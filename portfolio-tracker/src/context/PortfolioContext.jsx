import React, { createContext, useContext } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

const PortfolioContext = createContext();

export const usePortfolio = () => {
    const context = useContext(PortfolioContext);
    if (!context) {
        throw new Error("usePortfolio must be used within a PortfolioProvider");
    }
    return context;
};

export const PortfolioProvider = ({ children }) => {
    const [assets, setAssets] = useLocalStorage("portfolio_assets", []);

    const addAsset = (asset) => {
        setAssets((prev) => [...prev, { ...asset, id: Date.now().toString() }]);
    };

    const updateAsset = (id, updatedAsset) => {
        setAssets((prev) =>
            prev.map((asset) => (asset.id === id ? { ...asset, ...updatedAsset } : asset))
        );
    };

    const removeAsset = (id) => {
        setAssets((prev) => prev.filter((asset) => asset.id !== id));
    };

    const getAsset = (id) => {
        return assets.find((asset) => asset.id === id);
    };

    const value = {
        assets,
        addAsset,
        updateAsset,
        removeAsset,
        getAsset,
    };

    return (
        <PortfolioContext.Provider value={value}>
            {children}
        </PortfolioContext.Provider>
    );
};
