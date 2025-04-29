import { createConnection } from '../config/database.js';
import { cleanInput, extractWords } from '../utils/textProcessing.js';

/**
 * Gère le feedback positif en ajoutant de nouveaux mots au dictionnaire,
 * en créant une nouvelle solution et en mettant à jour la requête.
 *
 * @param {number} requestId - L'ID de la requête dans la table `requete`.
 * @param {string} question - La question posée par l'utilisateur.
 * @param {string} iaResponse - La réponse générée par l'IA.
 * @returns {Promise<{ success: boolean, newResolutionId?: number }>}
 */
export const handlePositiveFeedback = async (requestId, question, iaResponse) => {
  const connection = await createConnection();
  try {
    console.log("📌 handlePositiveFeedback appelé avec :", { requestId, question, iaResponse });

    // Nettoyage et extraction des mots-clés
    const cleaned = cleanInput(question);
    const words = extractWords(cleaned);
    console.log("🔍 Mots extraits :", words);

    if (words.length === 0) {
      console.warn("⚠️ Aucun mot-clé extrait de la question.");
      return { success: false };
    }

    // Récupération des mots déjà existants dans `dico`
    const existingWordsQuery = "SELECT id, libelle FROM dico WHERE libelle IN (?)";
    const [existingRows] = await connection.query(existingWordsQuery, [words]);

    // Vérification si la requête a échoué
    if (!existingRows) {
      console.error("❌ Échec de la récupération des mots-clés existants");
      return { success: false };
    }

    // Convertir les résultats en Map pour un accès rapide
    const existingWordsMap = new Map(existingRows.map(row => [row.libelle, row.id]));

    let keywordIds = [...existingWordsMap.values()];

    // Ajouter les nouveaux mots qui n'existent pas encore
    const newWords = words.filter(word => !existingWordsMap.has(word));

    if (newWords.length > 0) {
      const newWordsInsertQuery = "INSERT INTO dico (libelle) VALUES ?";
      const newWordsValues = newWords.map(word => [word]);

      const [insertResult] = await connection.query(newWordsInsertQuery, [newWordsValues]);

      // Vérifier si l'insertion a échoué
      if (!insertResult) {
        console.error("❌ Échec de l'insertion des nouveaux mots");
        return { success: false };
      }

      // Récupérer les nouveaux IDs générés
      for (let i = 0; i < newWords.length; i++) {
        keywordIds.push(insertResult.insertId + i);
      }
    }

    console.log("🆕 IDs des mots-clés stockés :", keywordIds);

    // Création d'une nouvelle résolution
    const keywordStr = keywordIds.join(',');
    const resolutionQuery = "INSERT INTO resolution (message, probleme_ids) VALUES (?, ?)";
    const [resResult] = await connection.query(resolutionQuery, [iaResponse, keywordStr]);

    // Vérifier si la création de la résolution a échoué
    if (!resResult) {
      console.error("❌ Échec de la création de la résolution");
      return { success: false };
    }

    const newResolutionId = resResult.insertId;
    console.log("✅ Nouvelle résolution créée avec ID :", newResolutionId);

    // Mise à jour de la requête
    const updateQuery = "UPDATE requete SET solutionId = ?, validation = TRUE WHERE id = ?";
    const [updateResult] = await connection.query(updateQuery, [newResolutionId, requestId]);

    // Vérifier si la mise à jour a échoué
    if (!updateResult) {
      console.error("❌ Échec de la mise à jour de la requête");
      return { success: false };
    }

    return { success: true, newResolutionId };
  } catch (error) {
    console.error("❌ Erreur dans handlePositiveFeedback :", error);
    return { success: false };
  } finally {
    await connection.end();
  }
};
