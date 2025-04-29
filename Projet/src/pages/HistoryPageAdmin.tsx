import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCw, ArrowLeft } from 'lucide-react';

interface HistoryItem {
  requeteId: number;
  name: string;
  demande: string;
  reponse: string;
  validation: boolean;
  created_at: string;
}

const HistoryPageAdmin: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]); // Initialiser comme tableau vide
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]); // Initialiser comme tableau vide
  const navigate = useNavigate();

  // Fonction pour récupérer l'historique
  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/histadmin');
      console.log('Données récupérées:', response.data);
      if (Array.isArray(response.data)) {
        setHistory(response.data);
        setFilteredHistory(response.data);
      } else {
        console.error('Les données renvoyées ne sont pas un tableau');
        alert('Erreur: l\'API ne renvoie pas un tableau, veuillez vérifier l\'API.');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique :', error);
      alert('Erreur lors de la récupération de l\'historique');
    }
  };

  // Appeler fetchHistory lors du premier rendu
  useEffect(() => {
    fetchHistory();
  }, []);

  // Fonction de recherche
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    // Filtrer les éléments en fonction de la recherche sur nom, demande, et réponse
    const filtered = history.filter(item => {
      const userMatch = item.name ? item.name.toLowerCase().includes(term) : false;
      const demandeMatch = item.demande ? item.demande.toLowerCase().includes(term) : false;
      const reponseMatch = item.reponse ? item.reponse.toLowerCase().includes(term) : false;

      // Retourner true si un des champs contient le terme recherché
      return userMatch || demandeMatch || reponseMatch;
    });

    setFilteredHistory(filtered);
  };

  // Fonction pour actualiser l'historique
  const handleRefresh = () => {
    fetchHistory();
    setSearchTerm('');
  };

  // Fonction pour parser le markdown
  const parseMarkdown = (text: string) => {
    if (!text) return '';  // Retourne une chaîne vide si 'text' est null ou undefined
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] p-4">
      <div className="flex items-center justify-between mb-4">
        {/* Groupe des boutons à gauche */}
        <div className="flex space-x-2">
          <button
            onClick={() => navigate('/stats')} // Remplacer par la page d'accueil admin
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

        {/* Titre centré */}
        <h1 className="text-2xl font-bold text-center flex-1">Historique des Conversations (Admin)</h1>

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
                <p className="font-bold text-[var(--text-color)]">Utilisateur: {item.name}</p>
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

export default HistoryPageAdmin;
