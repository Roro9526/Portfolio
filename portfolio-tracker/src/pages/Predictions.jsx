import React, { useState } from "react";
import { usePortfolio } from "../context/PortfolioContext";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Label } from "../components/ui/Label";

const AssetPredictionCard = ({ asset, onUpdate }) => {
    const [targets, setTargets] = useState(asset.exitTargets || {
        target1: { percent: 10, price: 0 },
        target2: { percent: 50, price: 0 },
        target3: { percent: 40, price: 0 },
    });

    const handleChange = (targetKey, field, value) => {
        setTargets(prev => ({
            ...prev,
            [targetKey]: { ...prev[targetKey], [field]: parseFloat(value) || 0 }
        }));
    };

    const calculateReturn = (target) => {
        const qtyToSell = asset.quantity * (target.percent / 100);
        return qtyToSell * target.price;
    };

    const totalReturn =
        calculateReturn(targets.target1) +
        calculateReturn(targets.target2) +
        calculateReturn(targets.target3);

    const initialInvestment = asset.quantity * asset.avgPrice;
    const potentialProfit = totalReturn - initialInvestment;
    const multiplier = initialInvestment > 0 ? totalReturn / initialInvestment : 0;

    const handleSave = () => {
        onUpdate(asset.id, { exitTargets: targets });
    };

    return (
        <div className="bg-white border border-gray-300 rounded p-6 mb-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{asset.symbol}</h3>
                    <p className="text-sm text-gray-600">{asset.quantity} units · {asset.type === 'stock' ? 'Stock' : 'Crypto'}</p>
                </div>
                <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">Potential Return</div>
                    <div className="text-2xl font-bold text-green-600">
                        ${totalReturn.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                </div>
            </div>

            {/* Targets */}
            <div className="grid grid-cols-3 gap-6 mb-6">
                {['target1', 'target2', 'target3'].map((key, index) => (
                    <div key={key} className="bg-gray-50 border border-gray-200 rounded p-4">
                        <div className="font-bold text-gray-900 mb-4">Target {index + 1}</div>

                        <div className="mb-4">
                            <Label className="text-sm text-gray-700 mb-2 block">Prix Visé ($)</Label>
                            <Input
                                type="number"
                                value={targets[key].price}
                                onChange={(e) => handleChange(key, 'price', e.target.value)}
                                className="w-full"
                                placeholder="0"
                            />
                        </div>

                        <div className="mb-4">
                            <Label className="text-sm text-gray-700 mb-2 block">% à Vendre</Label>
                            <Input
                                type="number"
                                value={targets[key].percent}
                                onChange={(e) => handleChange(key, 'percent', e.target.value)}
                                className="w-full"
                                placeholder="0"
                            />
                        </div>

                        <div className="pt-3 border-t border-gray-200">
                            <div className="text-xs text-gray-600">Valeur</div>
                            <div className="font-bold text-gray-900">
                                ${calculateReturn(targets[key]).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div className="flex gap-8">
                    <div>
                        <span className="text-sm text-gray-600">Multiplicateur: </span>
                        <span className="font-bold text-blue-600">{multiplier.toFixed(2)}x</span>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600">Profit: </span>
                        <span className={`font-bold ${potentialProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${potentialProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                    </div>
                </div>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Sauvegarder
                </Button>
            </div>
        </div>
    );
};

export const Predictions = () => {
    const { assets, updateAsset } = usePortfolio();

    const totalProjectedValue = assets.reduce((acc, asset) => {
        const targets = asset.exitTargets || {
            target1: { percent: 10, price: 0 },
            target2: { percent: 50, price: 0 },
            target3: { percent: 40, price: 0 },
        };

        const ret =
            (asset.quantity * (targets.target1.percent / 100) * targets.target1.price) +
            (asset.quantity * (targets.target2.percent / 100) * targets.target2.price) +
            (asset.quantity * (targets.target3.percent / 100) * targets.target3.price);

        return acc + ret;
    }, 0);

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Exit Strategy</h1>
                <div className="bg-blue-50 border border-blue-200 rounded px-6 py-3">
                    <div className="text-sm text-blue-700 mb-1">Valeur Projetée Totale</div>
                    <div className="text-2xl font-bold text-blue-900">${totalProjectedValue.toLocaleString()}</div>
                </div>
            </div>

            {/* Assets */}
            {assets.length > 0 ? (
                assets.map(asset => (
                    <AssetPredictionCard key={asset.id} asset={asset} onUpdate={updateAsset} />
                ))
            ) : (
                <div className="bg-gray-50 border border-gray-300 rounded px-4 py-12 text-center text-gray-500">
                    Aucun actif trouvé. Ajoute des actifs dans le Dashboard.
                </div>
            )}
        </div>
    );
};
