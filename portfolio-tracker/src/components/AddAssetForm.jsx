import React, { useState } from "react";
import { usePortfolio } from "../context/PortfolioContext";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Plus, RefreshCw } from "lucide-react";
import { fetchCryptoPrice } from "../lib/priceService";

export const AddAssetForm = () => {
    const { addAsset } = usePortfolio();
    const [isOpen, setIsOpen] = useState(false);
    const [loadingPrice, setLoadingPrice] = useState(false);
    const [formData, setFormData] = useState({
        type: "crypto", // 'crypto' or 'stock'
        symbol: "",
        name: "",
        quantity: "",
        avgPrice: "",
        currentPrice: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        addAsset({
            ...formData,
            quantity: parseFloat(formData.quantity),
            avgPrice: parseFloat(formData.avgPrice),
            currentPrice: parseFloat(formData.currentPrice),
            exitTargets: {
                target1: { percent: 10, price: 0 },
                target2: { percent: 50, price: 0 },
                target3: { percent: 40, price: 0 },
            }
        });
        setFormData({ type: "crypto", symbol: "", name: "", quantity: "", avgPrice: "", currentPrice: "" });
        setIsOpen(false);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFetchPrice = async () => {
        if (!formData.symbol || formData.type !== 'crypto') return;

        setLoadingPrice(true);
        const price = await fetchCryptoPrice(formData.symbol);
        if (price) {
            setFormData(prev => ({ ...prev, currentPrice: price }));
        }
        setLoadingPrice(false);
    };

    if (!isOpen) {
        return (
            <Button onClick={() => setIsOpen(true)} className="w-full md:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Add Asset
            </Button>
        );
    }

    return (
        <Card className="w-full max-w-md mx-auto mb-8 animate-in fade-in slide-in-from-bottom-4">
            <CardHeader>
                <CardTitle>Add New Asset</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Asset Type</Label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="type"
                                    value="crypto"
                                    checked={formData.type === "crypto"}
                                    onChange={handleChange}
                                    className="accent-primary"
                                />
                                Crypto
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="type"
                                    value="stock"
                                    checked={formData.type === "stock"}
                                    onChange={handleChange}
                                    className="accent-primary"
                                />
                                Stock / Bourse
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="symbol">Symbol</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="symbol"
                                    name="symbol"
                                    placeholder={formData.type === 'crypto' ? "BTC" : "AAPL"}
                                    value={formData.symbol}
                                    onChange={handleChange}
                                    required
                                />
                                {formData.type === 'crypto' && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={handleFetchPrice}
                                        disabled={loadingPrice || !formData.symbol}
                                        title="Fetch Price"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${loadingPrice ? 'animate-spin' : ''}`} />
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder={formData.type === 'crypto' ? "Bitcoin" : "Apple Inc."}
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input
                                id="quantity"
                                name="quantity"
                                type="number"
                                step="any"
                                placeholder="0.5"
                                value={formData.quantity}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="avgPrice">Avg Buy Price ($)</Label>
                            <Input
                                id="avgPrice"
                                name="avgPrice"
                                type="number"
                                step="any"
                                placeholder="50000"
                                value={formData.avgPrice}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="currentPrice">Current Price ($)</Label>
                        <Input
                            id="currentPrice"
                            name="currentPrice"
                            type="number"
                            step="any"
                            placeholder="60000"
                            value={formData.currentPrice}
                            onChange={handleChange}
                            required
                        />
                        {formData.type === 'stock' && <p className="text-xs text-muted-foreground">Manual entry for stocks</p>}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Add Asset</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};
