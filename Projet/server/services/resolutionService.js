import { createConnection } from '../config/database.js';
import { cleanInput, extractWords, fixEncoding } from '../utils/textProcessing.js';
import { autoLearn } from './autoLearning.js';
import { handlePositiveFeedback } from './positiveFeedback.js';
import axios from 'axios';
import https from 'https';
import dotenv from 'dotenv';
import { log } from 'console';

dotenv.config();

const apiKey ='jLoSKnouqgVOjv1KSG8Ho1CaaZB17a1R';
const model = "mistral-large-latest";

// Création d'un agent HTTPS qui ignore les erreurs de certificat
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// Map pour stocker les dernières requêtes par utilisateur
const userLastRequests = new Map();
// Map pour stocker les solutions rejetées par utilisateur
const userRejectedSolutions = new Map();

// Fonction pour enregistrer un feedback (like/dislike) pour une solution
const recordFeedback = async (connection, solutionId, question, type, isContextuallyIncorrect = false) => {
  await connection.query(
    `INSERT INTO feedback (idSolution, question, feedbackType, dateFeedback, isContextuallyIncorrect) 
     VALUES (?, ?, ?, NOW(), ?)`,
    [solutionId, question, type, isContextuallyIncorrect]
  );
  console.log(`Feedback ${type} enregistré pour la solution ${solutionId} pour la question "${question}".`);
};

// Fonctions de similarité basées sur la distance de Levenshtein
const levenshteinDistance = (a, b) => {
  const matrix = [];

  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Initialisation
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // Suppression
          matrix[i][j - 1] + 1,      // Insertion
          matrix[i - 1][j - 1] + 1   // Substitution
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const computeSimilarity = (s1, s2) => {
  const distance = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  return maxLen === 0 ? 1 : 1 - distance / maxLen;
};

// Fonction pour appeler l'API Mistral
const callMistralAPI = async (prompt) => {
  try {
    const response = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      { model, messages: [{ role: "user", content: prompt }] },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        httpsAgent,
      }
    );
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Erreur API Mistral :", error.response?.data || error.message);
    return null;
  }
};

// Fonction pour obtenir un score de feedback contextuel pour une solution donnée
const getContextualFeedbackScore = async (solutionId, nouvelleQuestion, connection) => {
  const [feedbacks] = await connection.query(
    `SELECT question, feedbackType, isContextuallyIncorrect FROM feedback WHERE idSolution = ?`,
    [solutionId]
  );
  let score = 0;
  for (const fb of feedbacks) {
    const sim = computeSimilarity(fb.question.toLowerCase(), nouvelleQuestion.toLowerCase());
    const weight = fb.isContextuallyIncorrect ? 2 : 1;
    score += (fb.feedbackType === 'negatif' ? -sim * weight : sim);
  }
  return score;
};

// Fonction principale pour traiter la requête utilisateur
export const findResolution = async (message, userId) => {
  console.log('📌 findResolution appelé avec:', { message, userId });
  const connection = await createConnection();
  const lastUserMessage = message.trim().toLowerCase();

  try {
    const lowerMessage = message.trim().toLowerCase();

    // AutoLearning
    if (lowerMessage === 'autolearning') {
      await autoLearn();
      return "AutoLearning OK.";
    }

    // Gestion des feedback "oui" ou "non"
    if (lowerMessage === 'oui') {
      const lastRequestId = userLastRequests.get(userId);
      if (lastRequestId) {
         const [reqData] = await connection.query(
           `SELECT demande FROM requete WHERE id = ? AND user = ?`,
           [lastRequestId, userId]
        );
        
        const [repData] = await connection.query(
          `SELECT libelle FROM reponseIA WHERE idRequete = ?`,
          [lastRequestId]
        );
        if (reqData.length > 0 && repData.length > 0) {
          const question = reqData[0].demande;
          const iaResponseText = repData[0].libelle;
          console.log("📌 Feedback positif - question :", question);
          console.log("📌 Feedback positif - réponse IA :", iaResponseText);
          const result = await handlePositiveFeedback(lastRequestId, question, iaResponseText);
          await connection.query(
            "UPDATE resolution SET dislikeCount = GREATEST(dislikeCount - 1, 0) WHERE id = ?",
            [result.newResolutionId]
          );
          if (result.success) {
            console.log("✅ Nouvelle résolution enregistrée avec ID :", result.newResolutionId);
            userLastRequests.delete(userId);
            // Nettoyer les solutions rejetées après un feedback positif
            userRejectedSolutions.delete(userId);
            return "Merci pour votre retour ! Votre validation a été enregistrée.";
          } else {
            return "Erreur lors du traitement du feedback positif.";
          }
        } else {
          console.error("❌ Données introuvées pour la requête ID :", lastRequestId);
          return "Données manquantes pour valider la demande.";
        }
      }
      return "Je n'ai trouvé aucune demande récente à valider.";
    }

    if (lowerMessage === 'non') {
      const lastRequestId = userLastRequests.get(userId);
      if (lastRequestId) {
        const [reqData] = await connection.query(
          `SELECT solutionId, demande FROM requete WHERE id = ? AND user = ?`,
          [lastRequestId, userId]
        );
        if (reqData.length > 0 && reqData[0].solutionId) {
          const solutionId = reqData[0].solutionId;
          const questionOrigine = reqData[0].demande;
          
          // Ajouter la solution aux solutions rejetées pour cet utilisateur
          let rejectedSolutions = userRejectedSolutions.get(userId) || new Set();
          rejectedSolutions.add(solutionId);
          userRejectedSolutions.set(userId, rejectedSolutions);
          
          // Vérifier si la question actuelle diffère sensiblement de la question d'origine
          const sim = computeSimilarity(questionOrigine.toLowerCase(), message.toLowerCase());
          const isContextuallyIncorrect = sim < 0.85;
          
          await recordFeedback(connection, solutionId, questionOrigine, 'negatif', isContextuallyIncorrect);
          
          console.log(`Feedback negatif enregistré pour la solution ID ${solutionId} pour la question "${questionOrigine}" avec isContextuallyIncorrect=${isContextuallyIncorrect}`);
          
          // Optionnel : vérifier le nombre de feedbacks négatifs pour la solution sur ce contexte
          const [feedbackCount] = await connection.query(
            `SELECT COUNT(*) as count FROM feedback WHERE idSolution = ? AND feedbackType = 'negatif' AND isContextuallyIncorrect = TRUE AND question = ?`,
            [solutionId, questionOrigine]
          );
          
          if (feedbackCount.length > 0 && feedbackCount[0].count >= 1) {
            console.log(`La solution ${solutionId} a reçu un feedback négatif contextuel pour la question "${questionOrigine}".`);
          }
          userLastRequests.delete(userId);

          // Rechercher une nouvelle solution immédiatement
          return await findNewSolution(message, userId, connection);
        }
      }
      
      console.log("🔄 Recherche d'une nouvelle solution...");
      return "Je n'ai pas trouvé la requête précédente. Veuillez reposer votre question.";
    }
    
    // Recherche de toutes les requêtes validées
    const [validatedRequests] = await connection.query(
      `SELECT id, demande, solutionId, validation FROM requete WHERE validation = TRUE`
    );
    
    // Récupérer les solutions rejetées pour cet utilisateur
    const rejectedSolutions = userRejectedSolutions.get(userId) || new Set();
    
    // On vérifie si l'une des requêtes validées a une similarité >= 85%
    let matchedSolutionId = null;
    for (const req of validatedRequests) {
      // Ignorer les solutions déjà rejetées par l'utilisateur
      if (rejectedSolutions.has(req.solutionId)) {
        continue;
      }
      
      const sim = computeSimilarity(message.toLowerCase(), req.demande.toLowerCase());
      console.log(`Similarité entre "${message}" et "${req.demande}": ${sim}`);
      if (sim >= 0.85 && req.solutionId) {
        // Avant de choisir la solution, on vérifie son score contextuel
        const feedbackScore = await getContextualFeedbackScore(req.solutionId, message, connection);
        console.log(`Score de feedback pour la solution ${req.solutionId}: ${feedbackScore}`);
        // Si le score n'est pas trop négatif, on garde cette solution
        if (feedbackScore >= -1) {
          matchedSolutionId = req.solutionId;
          break;
        }
      }
    }
    if (matchedSolutionId) {
      const [solution] = await connection.query(
        `SELECT message FROM resolution WHERE id = ?`,
        [matchedSolutionId]
      );
      if (solution.length > 0) {
        // Enregistrer la requête même si une solution existe
        const [reqResult] = await connection.query(
          `INSERT INTO requete (demande, solutionId, validation, user) VALUES (?, ?, FALSE, ?)`,
          [message, matchedSolutionId, userId]
        );
        userLastRequests.set(userId, reqResult.insertId);
    
        console.log("📌 Nouvelle requête sauvegardée avec solution existante, ID:", reqResult.insertId);
        return solution[0].message;
      }
    }
    
    return await findNewSolution(message, userId, connection);
    
  } catch (error) {
    console.error('Erreur dans findResolution :', error);
    return "Une erreur est survenue, veuillez réessayer.";
  } finally {
    await connection.end();
  }
};

// Nouvelle fonction pour trouver une solution alternative
async function findNewSolution(message, userId, connection) {
  // Recherche dans reponseIA pour une réponse validée (via la jointure sur requete)
  const rejectedSolutions = userRejectedSolutions.get(userId) || new Set();
  const rejectedIds = Array.from(rejectedSolutions).join(',');
  
  const [responseFromAI] = await connection.query(
    `SELECT ri.libelle 
     FROM reponseIA ri 
     JOIN requete req ON ri.idRequete = req.id 
     WHERE req.demande = ? AND req.validation = TRUE
     AND (req.solutionId NOT IN (${rejectedIds || 0}))
     AND solutionId NOT IN (SELECT id FROM resolution WHERE dislikeCount >= 5)`,
    [message]
  );
  
  if (responseFromAI.length > 0) {
    console.log("📌 Réponse IA validée retrouvée :", responseFromAI[0].libelle);
    return responseFromAI[0].libelle;
  }
  
  // Si aucune solution validée n'est trouvée, appel à l'IA
  const iaPrompt = `

Tu es un chatbot spécialisé dans la maintenance informatique d'entreprise. Ton rôle est d'aider les utilisateurs à résoudre des problèmes informatiques courants et de fournir un support technique de base.
Tu dois être capable de diagnostiquer les problèmes, de proposer des solutions et de guider les utilisateurs à travers les étapes nécessaires pour les résoudre. 
Voici le message de l'utilisateur: "${message}"
Si le message n’est pas dans un contexte d’entreprise ou de support informatique, merci de lui répondre que tu n’es pas prévu pour ce genre de question. Termine toujours ta réponse par une phrase indiquant que si le problème persiste, il faut créer un ticket sur GLPI, et signe la réponse par "Bob.".

Voici quelques points clés à inclure dans ton comportement et tes réponses :

🔹 **Environnement de travail**  
- Entreprise de courtage en assurance
- Citrix(URL : vpx.francecourtage.fr)
- Teams et pack office
- Communicator
- logiciels métier
- firewall qui peut bloquer certains sites, la solution à cela est de faire un ticket 

🔹 **Accueil et identification du problème**  
- Saluer l'utilisateur de manière amicale et professionnelle.    

🔹 **Diagnostic et résolution**  
- Utiliser des connaissances de base en informatique pour identifier la cause du problème.  
- Proposer des solutions  étape par étape .  
- Fournir des instructions claires et faciles à suivre.  

🔹 **Suivi et satisfaction**  
- Vérifier si la solution proposée a résolu le problème.  
- Demander à l'utilisateur s'il a besoin d'aide supplémentaire.  
- Assurer la satisfaction de l'utilisateur avant de clôturer la conversation.  

🔹 **Comportement et ton**  
- Être patient, courtois et empathique.  
- Utiliser un langage simple et accessible.  
- Maintenir un ton professionnel tout en restant amical.  
 
 `;
  const iaResponse = await callMistralAPI(iaPrompt);
  let finalResponse = null;
  let solutionId = null;
  
  if (iaResponse?.choices?.[0]?.message?.content) {
    finalResponse = iaResponse.choices[0].message.content;
    // Insertion de la nouvelle résolution dans la table resolution
    const resolutionQuery = "INSERT INTO resolution (message, probleme_ids) VALUES (?, ?)";
    const [resResult] = await connection.query(resolutionQuery, [finalResponse, '']);
    solutionId = resResult.insertId;
    console.log("✅ Nouvelle résolution créée avec ID :", solutionId);
  } else {
    console.log("L'IA n'a pas répondu, passage au fallback.");
    // Traitement fallback par mots-clés
    const cleanedInput = cleanInput(message);
    const words = extractWords(cleanedInput);
    const [categoryRows] = await connection.query(`SELECT id, libelle FROM categorie`);
    let matchedCategory = categoryRows.find(cat => cleanedInput.includes(cat.libelle.toLowerCase()));
    const [rows] = await connection.query("SELECT id, libelle FROM dico");
    const matchedIds = rows
      .filter(row => words.includes(row.libelle.toLowerCase()))
      .map(row => row.id);
      
    if (matchedIds.length === 0) {
      const [result] = await connection.query(
        `INSERT INTO requete (demande, solutionId, validation, user) VALUES (?, NULL, FALSE, ?)`,
        [message, userId]
      );
      userLastRequests.set(userId, result.insertId);
      return "Je ne comprends pas votre demande. Pourriez-vous reformuler ?";
    }
    
    let conditions = matchedIds.map(id => `FIND_IN_SET(${id}, probleme_ids)`).join(' OR ');
    let query = `SELECT id, message, probleme_ids, idCategorie, dislikeCount 
                 FROM resolution 
                 WHERE ${conditions} 
                 AND dislikeCount < 5 
                 AND id NOT IN (${rejectedIds || 0})`;
                 
    const queryParams = [];
    if (matchedCategory) {
      query += " AND idCategorie = ?";
      queryParams.push(matchedCategory.id);
    }
    
    const [resolutions] = await connection.query(query, queryParams);
    if (resolutions.length === 0) {
      const [result] = await connection.query(
        `INSERT INTO requete (demande, solutionId, validation, user) VALUES (?, NULL, FALSE, ?)`,
        [message, userId]
      );
      userLastRequests.set(userId, result.insertId);
      return "Je n'ai pas trouvé de solution alternative pour ce problème spécifique. Je vous conseille de créer un ticket GLPI.";
    }
    
    const bestResolution = resolutions
      .map(res => ({
        ...res,
        matchCount: res.probleme_ids.split(',').filter(id => matchedIds.includes(parseInt(id.trim(), 10))).length
      }))
      .sort((a, b) => b.matchCount - a.matchCount)[0];
      
    finalResponse = fixEncoding(bestResolution.message);
    solutionId = bestResolution.id;
  }
  
  // Sauvegarde de la nouvelle requête dans la table requete
  const [reqResult] = await connection.query(
    `INSERT INTO requete (demande, solutionId, validation, user) VALUES (?, ?, FALSE, ?)`,
    [message, solutionId, userId]
  );
  userLastRequests.set(userId, reqResult.insertId);
  console.log("📌 Nouvelle requête sauvegardée avec ID:", reqResult.insertId);
  
  // Sauvegarde dans la table reponseIA
  await connection.query(
    `INSERT INTO reponseIA (idRequete, libelle) VALUES (?, ?)`,
    [reqResult.insertId, finalResponse]
  );
  
  return finalResponse;
}