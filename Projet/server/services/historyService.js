// services/historyService.js
import { createConnection } from '../config/database.js';

export const getHistoryByUser = async (userId) => {
  const connection = await createConnection();
  try {
    const [results] = await connection.query(
      `SELECT 
        r.id as requeteId, 
        r.demande, 
        r.validation, 
        ri.libelle as reponse, 
        ri.created_at 
      FROM requete r
      LEFT JOIN reponseia ri ON r.id = ri.idRequete
      WHERE r.user = ?
      ORDER BY ri.created_at DESC`,
      [userId]
    );
    return results;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique :", error);
    throw error;
  } finally {
    await connection.end();
  }
};
