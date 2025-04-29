import { createConnection } from '../config/database.js';

/**
 * Fonction d'auto-apprentissage qui analyse les requêtes non validées
 * et tente de les associer à des solutions existantes
 */
export const autoLearn = async () => {
  console.log("🤖 Démarrage de l'auto-apprentissage...");
  const connection = await createConnection();
  
  try {
    // Récupérer les requêtes non validées sans solution
    const [unvalidatedRequests] = await connection.query(
      `SELECT id, demande FROM requete 
       WHERE validation = FALSE AND solutionId IS NULL`
    );
    
    console.log(`📊 ${unvalidatedRequests.length} requêtes non validées trouvées`);
    
    if (unvalidatedRequests.length === 0) {
      return "Aucune requête à traiter pour l'auto-apprentissage.";
    }
    
    // Récupérer toutes les solutions existantes
    const [solutions] = await connection.query(
      `SELECT id, message, probleme_ids FROM resolution 
       WHERE dislikeCount < 3`
    );
    
    if (solutions.length === 0) {
      return "Aucune solution disponible pour l'auto-apprentissage.";
    }
    
    let learningCount = 0;
    
    // Pour chaque requête non validée
    for (const req of unvalidatedRequests) {
      // Rechercher une solution similaire
      // Logique simplifiée - dans un système réel, utilisez des algorithmes de NLP plus avancés
      const matchedSolution = solutions.find(sol => 
        sol.message.toLowerCase().includes(req.demande.toLowerCase()) ||
        req.demande.toLowerCase().includes(sol.message.substring(0, 50).toLowerCase())
      );
      
      if (matchedSolution) {
        // Associer la solution à la requête
        await connection.query(
          `UPDATE requete SET solutionId = ?, validation = TRUE 
           WHERE id = ?`,
          [matchedSolution.id, req.id]
        );
        
        learningCount++;
        console.log(`✅ Requête #${req.id} associée à la solution #${matchedSolution.id}`);
      }
    }
    
    console.log(`🎓 Auto-apprentissage terminé: ${learningCount} requêtes traitées`);
    return `Auto-apprentissage terminé: ${learningCount} requêtes ont été associées à des solutions.`;
    
  } catch (error) {
    console.error("❌ Erreur dans l'auto-apprentissage:", error);
    throw error;
  } finally {
    await connection.end();
  }
};