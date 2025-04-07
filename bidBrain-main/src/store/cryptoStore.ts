import { create } from 'zustand';
import axios from 'axios';
import type { CryptoAsset } from '../types';

interface PortfolioItem {
  id: string;
  amount: number;
}

interface CryptoState {
  assets: CryptoAsset[];
  portfolio: PortfolioItem[];
  balance: number; // 💰 Solde en EUR
  loading: boolean;
  error: string | null;
  selectedTimeframe: '1h' | '24h' | '7d' | '30d';
  
  fetchAssets: () => Promise<void>;
  fetchPriceHistory: (id: string) => Promise<any>;
  setTimeframe: (timeframe: '1h' | '24h' | '7d' | '30d') => void;
  
  buyCrypto: (id: string, amount: number, price: number) => void;
  sellCrypto: (id: string, amount: number, price: number) => void;
  depositMoney: (amount: number) => void;
}

export const useCryptoStore = create<CryptoState>((set, get) => ({
  assets: [],
  portfolio: [],
  balance: 1000, // 💰 Départ avec 1000€
  loading: false,
  error: null,
  selectedTimeframe: '24h',

  setTimeframe: (timeframe) => set({ selectedTimeframe: timeframe }),

  fetchAssets: async () => {
    set({ loading: true });
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/coins/markets',
        {
          params: {
            vs_currency: 'eur',
            order: 'market_cap_desc',
            per_page: 100,
            page: 1,
            sparkline: false,
          },
        }
      );
      set({ assets: response.data, loading: false, error: null });
    } catch (error) {
      set({ error: 'Erreur lors de la récupération des cryptos', loading: false });
    }
  },

  fetchPriceHistory: async (id: string) => {
    const timeframe = get().selectedTimeframe;
    const days = timeframe === '1h' ? 1 : timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30;
    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${id}/market_chart`,
        {
          params: {
            vs_currency: 'eur',
            days: days,
            interval: timeframe === '1h' ? 'hourly' : 'daily',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique des prix:', error);
      return null;
    }
  },

  buyCrypto: (id, amount, price) => {
    const totalCost = amount * price;
    const { balance, portfolio } = get();

    if (totalCost > balance) {
      alert("Fonds insuffisants !");
      return;
    }

    const updatedPortfolio = [...portfolio];
    const existingAsset = updatedPortfolio.find((item) => item.id === id);

    if (existingAsset) {
      existingAsset.amount += amount;
    } else {
      updatedPortfolio.push({ id, amount });
    }

    set({
      balance: balance - totalCost,
      portfolio: updatedPortfolio,
    });
  },

  sellCrypto: (id, amount, price) => {
    const { portfolio, balance } = get();
    const existingAsset = portfolio.find((item) => item.id === id);

    if (!existingAsset || existingAsset.amount < amount) {
      alert("Quantité insuffisante !");
      return;
    }

    const updatedPortfolio = portfolio.map((item) =>
      item.id === id ? { ...item, amount: item.amount - amount } : item
    ).filter((item) => item.amount > 0);

    set({
      balance: balance + amount * price,
      portfolio: updatedPortfolio,
    });
  },

  depositMoney: (amount) => {
    set((state) => ({ balance: state.balance + amount }));
  },
}));
