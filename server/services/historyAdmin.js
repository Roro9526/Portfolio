import { createConnection } from '../config/database.js';

// Fonction pour récupérer l'historique des admins
export const getHistoryAdmin = async () => {
  const connection = await createConnection();
  try {
    const [results] = await connection.query(
      `SELECT 
        requete.id as requeteId, 
        user.libelle as name,
        requete.demande, 
        requete.validation, 
        reponseia.libelle as reponse, 
        reponseia.created_at 
      FROM requete 
      LEFT JOIN reponseia ON requete.id = reponseia.idRequete
      LEFT JOIN user ON user.id = requete.user
      ORDER BY reponseia.created_at DESC`
    );
    return results; // Devrait renvoyer un tableau d'objets
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique admin:", error);
    throw error; // Propagation de l'erreur si ça échoue
  } finally {
    await connection.end();
  }
};