import { createConnection } from '../config/database.js';

export const autoLearn = async () => {
  const connection = await createConnection();

  try {
    // Étape 1 : Récupérer les phrases validées et leurs `solutionId`
    const [validatedRequests] = await connection.query(
      `SELECT demande, solutionId FROM requete WHERE validation = '1'`
    );

    if (validatedRequests.length === 0) {
      console.log("Aucune phrase validée à analyser.");
      return;
    }

    // Étape 2 : Extraire les mots uniques et créer un mapping mot -> solutionId
    const wordResolutionMap = {}; // { word: [solutionId1, solutionId2, ...] }
    const wordsToProcess = new Set();

    validatedRequests.forEach(({ demande, solutionId }) => {
      const words = demande
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 0);

      words.forEach(word => {
        wordsToProcess.add(word);
        if (!wordResolutionMap[word]) {
          wordResolutionMap[word] = new Set();
        }
        wordResolutionMap[word].add(solutionId);
      });
    });

    const wordsArray = Array.from(wordsToProcess);

    if (wordsArray.length === 0) {
      console.log("Aucun mot valide trouvé dans les phrases validées.");
      return;
    }

    // Étape 3 : Vérifier les mots existants dans le dictionnaire
    const [existingWords] = await connection.query(
      `SELECT id, libelle FROM dico WHERE libelle IN (?)`,
      [wordsArray]
    );

    const existingWordsMap = new Map(existingWords.map(({ id, libelle }) => [libelle, id]));
    const newWordsToAdd = wordsArray.filter(word => !existingWordsMap.has(word));

    // Étape 4 : Ajouter les nouveaux mots au dictionnaire
    if (newWordsToAdd.length > 0) {
      const placeholders = newWordsToAdd.map(() => '(?)').join(',');
      const insertQuery = `INSERT INTO dico (libelle) VALUES ${placeholders}`;
      await connection.query(insertQuery, newWordsToAdd.map(word => [word]));

      console.log(`${newWordsToAdd.length} nouveaux mots ajoutés au dictionnaire`);

      // Mettre à jour la map avec les nouveaux mots et leurs IDs
      const [newWords] = await connection.query(
        `SELECT id, libelle FROM dico WHERE libelle IN (?)`,
        [newWordsToAdd]
      );

      newWords.forEach(({ id, libelle }) => {
        existingWordsMap.set(libelle, id);
      });
    } else {
      console.log("Tous les mots existent déjà dans le dictionnaire.");
    }

    // Étape 5 : Mise à jour des `probleme_ids` dans la table `resolution`
    const resolutionUpdates = {};

    // Associer chaque mot à ses `solutionId`
    Object.entries(wordResolutionMap).forEach(([word, solutionIds]) => {
      if (existingWordsMap.has(word)) {
        const wordId = existingWordsMap.get(word);
        solutionIds.forEach(solutionId => {
          if (!resolutionUpdates[solutionId]) {
            resolutionUpdates[solutionId] = new Set();
          }
          resolutionUpdates[solutionId].add(wordId);
        });
      }
    });

    // Appliquer les mises à jour
    for (const [solutionId, wordIds] of Object.entries(resolutionUpdates)) {
      const idsToAdd = Array.from(wordIds).join(',');

      // Ajouter les IDs uniquement si `probleme_ids` ne les contient pas déjà
      await connection.query(
        `UPDATE resolution 
         SET probleme_ids = TRIM(BOTH ',' FROM CONCAT_WS(',', probleme_ids, ?)) 
         WHERE id = ?`,
        [idsToAdd, solutionId]
      );
    }

    console.log("Mise à jour des `probleme_ids` terminée.");
  } catch (error) {
    console.error("Erreur dans l'auto-apprentissage :", error);
  } finally {
    await connection.end();
  }
};
