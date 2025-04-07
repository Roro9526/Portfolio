import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order } from '../types';
import { useAuthStore } from './authStore';
import { useCryptoStore } from './cryptoStore';
import { toast } from 'react-hot-toast';

interface OrderState {
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'status'>) => void;
  cancelOrder: (orderId: string) => void;
  executeOrder: (orderId: string) => void;
  checkLimitOrders: () => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      addOrder: (orderData) => {
        const user = useAuthStore.getState().user;
        if (!user) {
          toast.error('Vous devez être connecté pour passer un ordre');
          return;
        }

        const order: Order = {
          id: crypto.randomUUID(),
          userId: user.id,
          createdAt: new Date().toISOString(),
          status: 'pending',
          ...orderData,
        };

        if (order.type === 'market') {
          get().executeOrder(order.id);
        }

        set((state) => ({
          orders: [...state.orders, order],
        }));
      },
      cancelOrder: (orderId) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId ? { ...order, status: 'cancelled' } : order
          ),
        }));
        toast.success('Ordre annulé');
      },
      executeOrder: (orderId) => {
        const order = get().orders.find((o) => o.id === orderId);
        if (!order || order.status !== 'pending') return;

        const user = useAuthStore.getState().user;
        if (!user) return;

        const asset = useCryptoStore.getState().assets.find((a) => a.id === order.cryptoId);
        if (!asset) return;

        const currentPrice = asset.current_price;
        const totalCost = order.amount * (order.type === 'market' ? currentPrice : order.price);

        if (order.operation === 'buy') {
          if (user.balance < totalCost) {
            toast.error('Solde insuffisant');
            return;
          }

          useAuthStore.getState().updateBalance(user.id, -totalCost);
          useAuthStore.getState().updatePortfolio(user.id, order.cryptoId, order.amount);
        } else {
          const currentAmount = user.portfolio[order.cryptoId] || 0;
          if (currentAmount < order.amount) {
            toast.error('Quantité insuffisante');
            return;
          }

          useAuthStore.getState().updateBalance(user.id, totalCost);
          useAuthStore.getState().updatePortfolio(user.id, order.cryptoId, -order.amount);
        }

        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status: 'completed' } : o
          ),
        }));

        toast.success(`Ordre ${order.operation === 'buy' ? 'd\'achat' : 'de vente'} exécuté`);
      },
      checkLimitOrders: () => {
        const assets = useCryptoStore.getState().assets;
        const pendingLimitOrders = get().orders.filter(
          (order) => order.type === 'limit' && order.status === 'pending'
        );

        pendingLimitOrders.forEach((order) => {
          const asset = assets.find((a) => a.id === order.cryptoId);
          if (!asset) return;

          const currentPrice = asset.current_price;
          const shouldExecute =
            (order.operation === 'buy' && currentPrice <= order.price) ||
            (order.operation === 'sell' && currentPrice >= order.price);

          if (shouldExecute) {
            get().executeOrder(order.id);
          }
        });
      },
    }),
    {
      name: 'orders-storage',
    }
  )
);