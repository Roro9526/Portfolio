import React, { useState } from "react";
import { usePortfolio } from "../context/PortfolioContext";
import { AddAssetForm } from "../components/AddAssetForm";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Label } from "../components/ui/Label";
import { useAutoRefreshPrices } from "../hooks/useAutoRefreshPrices";

export const Dashboard = () => {
    const { assets, updateAsset, removeAsset } = usePortfolio();
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    // Auto-refresh crypto prices every 5 minutes
    useAutoRefreshPrices(assets, updateAsset);

    const cryptoAssets = assets.filter(a => a.type === 'crypto' || !a.type);
    const stockAssets = assets.filter(a => a.type === 'stock');

    const totalValue = assets.reduce((acc, asset) => acc + (asset.quantity * asset.currentPrice), 0);
    const totalCost = assets.reduce((acc, asset) => acc + (asset.quantity * asset.avgPrice), 0);
    const totalProfit = totalValue - totalCost;
    const profitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    const handleEdit = (asset) => {
        setEditingId(asset.id);
        setEditForm({ ...asset });
    };

    const handleSaveEdit = () => {
        updateAsset(editingId, {
            quantity: parseFloat(editForm.quantity),
            avgPrice: parseFloat(editForm.avgPrice),
            currentPrice: parseFloat(editForm.currentPrice),
        });
        setEditingId(null);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleDelete = (id) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet actif ?')) {
            removeAsset(id);
        }
    };

    const AssetTable = ({ title, assets }) => (
        <div className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
            {assets.length > 0 ? (
                <div className="bg-white border border-gray-300 rounded overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Symbol</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-700">Quantity</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-700">Avg Price</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-700">Current Price</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-700">Value</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-700">P&L</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assets.map((asset, index) => {
                                const isEditing = editingId === asset.id;
                                const value = asset.quantity * asset.currentPrice;
                                const profit = value - (asset.quantity * asset.avgPrice);
                                const profitP = (profit / (asset.quantity * asset.avgPrice)) * 100;

                                return (
                                    <tr key={asset.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-4 py-3 font-medium text-gray-900">{asset.symbol}</td>
                                        <td className="px-4 py-3 text-gray-700">{asset.name}</td>
                                        <td className="px-4 py-3 text-right text-gray-700">
                                            {isEditing ? (
                                                <Input
                                                    type="number"
                                                    value={editForm.quantity}
                                                    onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                                                    className="w-24 text-right"
                                                />
                                            ) : asset.quantity}
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-700">
                                            {isEditing ? (
                                                <Input
                                                    type="number"
                                                    value={editForm.avgPrice}
                                                    onChange={(e) => setEditForm({ ...editForm, avgPrice: e.target.value })}
                                                    className="w-28 text-right"
                                                />
                                            ) : `$${asset.avgPrice.toLocaleString()}`}
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-700">
                                            {isEditing ? (
                                                <Input
                                                    type="number"
                                                    value={editForm.currentPrice}
                                                    onChange={(e) => setEditForm({ ...editForm, currentPrice: e.target.value })}
                                                    className="w-28 text-right"
                                                />
                                            ) : `$${asset.currentPrice.toLocaleString()}`}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                                            ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                        </td>
                                        <td className={`px-4 py-3 text-right font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {profit >= 0 ? '+' : ''}{profitP.toFixed(2)}% (${profit.toFixed(2)})
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={handleSaveEdit}
                                                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                                    >
                                                        OK
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="px-3 py-1 bg-gray-400 text-white text-sm rounded hover:bg-gray-500"
                                                    >
                                                        Annuler
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(asset)}
                                                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                                    >
                                                        Modifier
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(asset.id)}
                                                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                                    >
                                                        Supprimer
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-gray-50 border border-gray-300 rounded px-4 py-8 text-center text-gray-500">
                    No {title.toLowerCase()} found.
                </div>
            )}
        </div>
    );

    return (
        <div>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded p-6">
                    <div className="text-sm text-blue-700 font-medium mb-1">Total Balance</div>
                    <div className="text-3xl font-bold text-blue-900">
                        ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded p-6">
                    <div className="text-sm text-green-700 font-medium mb-1">Total Profit</div>
                    <div className="text-3xl font-bold text-green-900">
                        ${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-green-700 mt-1">{profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%</div>
                </div>
            </div>

            {/* Add Asset Button */}
            <div className="mb-8">
                <AddAssetForm />
            </div>

            {/* Asset Tables */}
            <AssetTable title="Crypto Assets" assets={cryptoAssets} />
            <AssetTable title="Stock Assets" assets={stockAssets} />
        </div>
    );
};
