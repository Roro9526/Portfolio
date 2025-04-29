import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LogOut, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LineChart, Line, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import UserManagement from '../components/userManagement';

// 📌 Interfaces pour les statistiques
interface Stats {
  totalQuestions: number;
  totalValidated: number;
  totalPending: number;
  feedbackStats: {
    positive: number;
    negative: number;
  };
  dailyQuestions: Array<{ date: string; count: number; }>;
  topCategories: Array<{ category: string; count: number; }>;
}

// 📌 Couleurs pour le Camembert
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// 📌 Composant principal
const StatsPage: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  // 📌 Fonction pour récupérer les statistiques
  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/stats');
      setStats(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des statistiques');
      console.error('Error fetching stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBack = () => {
    navigate('/chat');
  };

  const handleGoToHistory = () => {
    navigate('/histadmin'); // Remplacer par le chemin de la page d'historique admin
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-color)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-color)]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-color)]">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl">
          <p className="text-red-500 text-center mb-4">{error}</p>
          <div className="flex justify-between">
            <button
              onClick={handleBack}
              className="bg-[var(--primary-hover-color)] hover:bg-[var(--primary-color)] text-white px-4 py-2 rounded-md flex items-center"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Retour
            </button>

            <button
              onClick={fetchStats}
              className="bg-[var(--primary-color)] hover:bg-[var(--primary-hover-color)] text-white px-4 py-2 rounded-md"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)]">
      <header className="bg-[var(--primary-color)] text-[var(--title-color)] p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
             className="bg-[var(--logout-color)] hover:bg-[var(--logout-hover-color)] text-white px-3 py-2 rounded-md flex items-center"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Retour
            </button>
            <h1 className="text-2xl font-bold">Statistiques du Bot</h1>
          </div>
          <div className="flex items-center space-x-4">
          <button
              onClick={handleGoToHistory} // Ajout du bouton "Historique"
              className="bg-[var(--glpi-color)] hover:bg-[var(--glpi-hover-color)] text-white px-3 py-2 rounded-md flex items-center text-sm"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Historique
            </button>
            <button
              onClick={fetchStats}
             className="bg-[var(--glpi-color)] hover:bg-[var(--glpi-hover-color)] text-white px-3 py-2 rounded-md flex items-center text-sm"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Actualiser
            </button>
            <button
              onClick={handleLogout}
              className="bg-[var(--logout-color)] hover:bg-[var(--logout-hover-color)] text-white px-3 py-2 rounded-md flex items-center"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 text-[var(--text-color)]">
        {/* 📊 Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Questions Totales", value: stats?.totalQuestions, color: "var(--text-color)" },
            { label: "Questions Validées", value: stats?.totalValidated, color: "green" },
            { label: "En Attente", value: stats?.totalPending, color: "yellow" },
            { label: "Taux de Satisfaction", value: stats?.feedbackStats ? Math.round((stats.feedbackStats.positive / (stats.feedbackStats.positive + stats.feedbackStats.negative)) * 100) + "%" : "0%", color: "purple" }
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[var(--bg-color)] rounded-lg shadow p-6 border border-[var(--border-color)]">
              <h3 className="text-lg font-semibold mb-2">{label}</h3>
              <p className={`text-3xl font-bold text-[${color}]`}>{value}</p>
            </div>
          ))}
        </div>

        {/* 📈 Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <LineChart width={500} height={300} data={stats?.dailyQuestions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="var(--text-color)" />
              <YAxis stroke="var(--text-color)" />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#8884d8" />
            </LineChart>
          </div>
          <div>
            <PieChart width={500} height={300}>
              <Pie data={stats?.topCategories} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={100}>
                {stats?.topCategories.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </div>
        </div>

        {/* 📋 Gestion des utilisateurs */}
        <UserManagement />
      </main>
    </div>
  );
};

export default StatsPage;
