export interface User {
  id: string;
  username: string;
  password: string;
  balance: number;
  portfolio: {
    [key: string]: number;
  };
}

export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
  image: string;
}

export interface Order {
  id: string;
  userId: string;
  type: 'market' | 'limit';
  operation: 'buy' | 'sell';
  cryptoId: string;
  amount: number;
  price: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  cryptoId: string;
  title: string;
  content: string;
  likes: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'buy' | 'sell' | 'transfer' | 'deposit' | 'withdrawal';
  cryptoId?: string;
  amount: number;
  price?: number;
  toUserId?: string;
  createdAt: string;
}