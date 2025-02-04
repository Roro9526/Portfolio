import { createConnection } from '../config/database.js';
import { cleanInput, extractWords, fixEncoding } from '../utils/textProcessing.js';
import {autoLearn } from '../services/autoLearning.js';


// Zone mémoire pour stocker l'ID de la dernière requête par utilisateur
const userRequestMemory = {};

export const findResolution = async (message, userId) => {
  const connection = await createConnection();

  try {
    if (message.trim().toLowerCase() === 'autolearning') {
      const autoLearnResult = await autoLearn();
      return "AutoLearning OK.";
    }

    // Vérifier si le message est "oui" pour valider la dernière requête de l'utilisateur
    if (message.trim().toLowerCase() === 'oui') {
      const lastRequestId = userRequestMemory[userId];

      if (lastRequestId) {
        // Mettre à jour la validation de cette requête
        await connection.query(
          `UPDATE requete SET validation = true WHERE id = ?`,
          [lastRequestId]
        );

        // Supprimer l'entrée de la mémoire une fois validée
        delete userRequestMemory[userId];

        return "Merci pour votre retour ! Votre validation a été enregistrée.";
      } else {
        return "Je n'ai trouvé aucune demande récente à valider pour vous.";
      }
    }

    // Vérification pour "non" pour indiquer que la demande n'a pas été résolue ou validée
    if (message.trim().toLowerCase() === 'non') {
      return "D'accord, je vais chercher une autre solution ou reformuler la demande.";
    }

    // Nettoyer l'entrée et extraire les mots
    const cleanedInput = cleanInput(message);
    const words = extractWords(cleanedInput);

    console.log('Mots extraits après nettoyage :', words);

    // Rechercher la catégorie dans le message
    const [categoryRows] = await connection.query(
      `SELECT id, libelle FROM categorie`
    );

    let matchedCategory = null;
    categoryRows.forEach(category => {
      const categoryLibelle = category.libelle.toLowerCase();
      // Si un mot de la catégorie est trouvé dans le message
      if (cleanedInput.includes(categoryLibelle)) {
        matchedCategory = category;
      }
    });

    if (matchedCategory) {
      console.log('Catégorie identifiée :', matchedCategory.libelle);
    } else {
      console.log("Aucune catégorie identifiée. Recherche de la meilleure compatibilité.");
    }

    // Rechercher les mots-clés dans la table 'dico' (mots associés aux problèmes)
    const [rows] = await connection.query("SELECT id, libelle FROM dico");
    const matchedIds = [];

    rows.forEach(row => {
      const libelle = row.libelle.toLowerCase();
      if (words.some(word => word === libelle)) {
        matchedIds.push(row.id);
      }
    });

    console.log('IDs correspondants trouvés :', matchedIds);

    if (matchedIds.length === 0) {
      // Enregistrer la requête sans solution (solutionId = NULL)
      const [result] = await connection.query(
        `INSERT INTO requete (demande, solutionId, validation) VALUES (?, NULL, ?)`,
        [message, false]
      );

      // Stocker l'ID de la requête dans la zone mémoire
      userRequestMemory[userId] = result.insertId;

      return "Je ne comprends pas votre demande. Pourriez-vous reformuler ?";
    }

    // Construire la requête SQL pour trouver les résolutions
    let conditions = matchedIds.map(id => `FIND_IN_SET(${id}, probleme_ids)`).join(' OR ');
    let query = `SELECT id, message, probleme_ids, idCategorie FROM resolution WHERE ${conditions}`;
    const queryParams = [];

    if (matchedCategory) {
      query += " AND idCategorie = ?";
      queryParams.push(matchedCategory.id);
    }

    const [resolutions] = await connection.query(query, queryParams);

    if (resolutions.length === 0) {
      // Enregistrer la requête sans solution (solutionId = NULL)
      const [result] = await connection.query(
        `INSERT INTO requete (demande, solutionId, validation) VALUES (?, NULL, ?)`,
        [message, false]
      );

      // Stocker l'ID de la requête dans la zone mémoire
      userRequestMemory[userId] = result.insertId;

      return "Je n'ai pas trouvé de solution pour ce problème spécifique.";
    }

    // Calculer les scores de pertinence et trier les solutions
    const detailedResolutions = resolutions.map((resolution) => {
      const problemIds = resolution.probleme_ids
        .split(',')
        .map(id => parseInt(id.trim(), 10));
      const matchCount = problemIds.filter(id => matchedIds.includes(id)).length;
      return { ...resolution, matchCount };
    });

    const sortedResolutions = detailedResolutions.sort(
      (a, b) => b.matchCount - a.matchCount
    );

    console.log('Résolutions triées par pertinence :', sortedResolutions);

    const bestResolution = sortedResolutions[0];
    const correctedMessage = fixEncoding(bestResolution.message);

    // Enregistrer la requête avec la solutionId
    const [result] = await connection.query(
      `INSERT INTO requete (demande, solutionId, validation) VALUES (?, ?, ?)`,
      [message, bestResolution.id, false]
    );

    // Stocker l'ID de la requête dans la zone mémoire
    userRequestMemory[userId] = result.insertId;

    return correctedMessage;

  } catch (error) {
    console.error('Erreur dans findResolution :', error);
    throw error; // Pour remonter l'erreur si nécessaire
  } finally {
    await connection.end();
  }
};
