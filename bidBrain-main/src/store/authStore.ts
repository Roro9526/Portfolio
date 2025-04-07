import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  register: (username: string, password: string) => boolean;
  updateBalance: (userId: string, amount: number) => void;
  updatePortfolio: (userId: string, cryptoId: string, amount: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      login: (username: string, password: string) => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(
          (u: User) => u.username === username && u.password === password
        );
        if (user) {
          set({ user });
          return true;
        }
        return false;
      },
      logout: () => {
        set({ user: null });
      },
      register: (username: string, password: string) => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.some((u: User) => u.username === username)) {
          return false;
        }
        const newUser: User = {
          id: crypto.randomUUID(),
          username,
          password,
          balance: 10000, // Solde initial de 10 000 €
          portfolio: {},
        };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        set({ user: newUser });
        return true;
      },
      updateBalance: (userId: string, amount: number) => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const updatedUsers = users.map((u: User) =>
          u.id === userId ? { ...u, balance: u.balance + amount } : u
        );
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        
        const currentUser = get().user;
        if (currentUser && currentUser.id === userId) {
          set({
            user: { ...currentUser, balance: currentUser.balance + amount },
          });
        }
      },
      updatePortfolio: (userId: string, cryptoId: string, amount: number) => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const updatedUsers = users.map((u: User) => {
          if (u.id === userId) {
            const currentAmount = u.portfolio[cryptoId] || 0;
            const newAmount = currentAmount + amount;
            return {
              ...u,
              portfolio: {
                ...u.portfolio,
                [cryptoId]: newAmount > 0 ? newAmount : 0,
              },
            };
          }
          return u;
        });
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        
        const currentUser = get().user;
        if (currentUser && currentUser.id === userId) {
          const currentAmount = currentUser.portfolio[cryptoId] || 0;
          const newAmount = currentAmount + amount;
          set({
            user: {
              ...currentUser,
              portfolio: {
                ...currentUser.portfolio,
                [cryptoId]: newAmount > 0 ? newAmount : 0,
              },
            },
          });
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);