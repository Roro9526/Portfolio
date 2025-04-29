import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  username: string;
  displayName: string;
  email: string;
  groups: string[];
  iduser:number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Configure axios base URL
const API_BASE_URL = import.meta.env.DEV ? 'https://sos.francecourtage.fr' : '';
axios.defaults.baseURL = API_BASE_URL;

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté à partir du localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
  
      const response = await axios.post('/api/auth/login', { username, password });
  
      if (response.data.success) {
        const userData = response.data.user;
        setUser(userData);
  
        // Vérifie ici que les données sont bien stockées dans localStorage
        localStorage.setItem('user', JSON.stringify(userData));  // Stocke l'utilisateur dans le localStorage
        return true;
      } else {
        setError(response.data.message || 'Échec de connexion');
        return false;
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Échec de connexion');
      } else {
        setError('Erreur de connexion au serveur');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };
  

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
