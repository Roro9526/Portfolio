import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCw, ArrowLeft } from 'lucide-react';

interface HistoryItem {
  requeteId: number;
  demande: string;
  reponse: string;
  validation: boolean;
  created_at: string;
}

const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchHistory = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`/api/history/${user.iduser}`);
      setHistory(response.data);
      setFilteredHistory(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique :', error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = history.filter(item =>
      item.demande.toLowerCase().includes(term) || item.reponse.toLowerCase().includes(term)
    );
    setFilteredHistory(filtered);
  };

  const handleRefresh = () => {
    fetchHistory();
    setSearchTerm('');
  };


  const parseMarkdown = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };



  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] p-4">
      <div className="flex items-center justify-between mb-4">
  {/* Groupe des boutons à gauche */}
  <div className="flex space-x-2">
    <button
      onClick={() => navigate('/chat')}
      className="bg-[var(--logout-color)] hover:bg-[var(--logout-hover-color)] text-white px-3 py-2 rounded-md flex items-center"
    >
      <ArrowLeft className="h-5 w-5 mr-2" />
      Retour
    </button>
    <button
      onClick={handleRefresh}
      className="bg-[var(--glpi-color)] hover:bg-[var(--glpi-hover-color)] text-white px-3 py-2 rounded-md flex items-center"
    >
      <RefreshCw className="h-5 w-5 mr-2" />
      Actualiser
    </button>
  </div>

  {/* Titre centré avec flex-1 pour pousser à gauche et droite */}
  <h1 className="text-2xl font-bold text-center flex-1">
    Historique des Conversations
  </h1>

  {/* Espace à droite pour équilibrer */}
  <div className="w-[180px]" />
</div>


      <div className="flex mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Rechercher une question ou une réponse..."
          className="w-full p-2 border border-[var(--border-color)] rounded-lg"
        />
        <Search className="ml-2 h-6 w-6 text-[var(--primary-color)]" />
      </div>

      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <p>Aucun historique trouvé.</p>
        ) : (
          filteredHistory.map(item => (
            <div key={item.requeteId} className="bg-[var(--message-bg)] p-4 rounded-lg shadow">
              <div className="flex justify-between">
                <p className="font-bold text-[var(--text-color)]">Question:</p>
                <p>{new Date(item.created_at).toLocaleString()}</p>
              </div>
              <p className="mb-2">{item.demande}</p>
              <div>
                <p className="font-bold text-[var(--text-color)] mb-1">Réponse:</p>
                <p
  className="whitespace-pre-wrap text-[var(--text-color)]"
  dangerouslySetInnerHTML={{ __html: parseMarkdown(item.reponse) }}
></p>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
