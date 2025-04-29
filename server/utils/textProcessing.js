
/**
 * Nettoie le texte d'entrée en le convertissant en minuscules et en supprimant les caractères spéciaux
 * @param {string} input - Le texte à nettoyer
 * @returns {string} Le texte nettoyé
 */
export const cleanInput = (input) => {
  if (!input) return '';
  return input
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Extrait les mots significatifs d'un texte
 * @param {string} text - Le texte à analyser
 * @returns {string[]} Liste des mots significatifs
 */
export const extractWords = (text) => {
  if (!text) return [];
  
  // Liste de mots à ignorer (stop words)
  const stopWords = [
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'a', 'au', 'aux',
    'et', 'ou', 'mais', 'donc', 'car', 'ni', 'que', 'qui', 'quoi', 'dont',
    'où', 'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles',
    'ce', 'cet', 'cette', 'ces', 'mon', 'ton', 'son', 'ma', 'ta', 'sa',
    'mes', 'tes', 'ses', 'notre', 'votre', 'leur', 'nos', 'vos', 'leurs',
    'pour', 'par', 'en', 'dans', 'sur', 'sous', 'avec', 'sans', 'chez',
    'est', 'sont', 'être', 'avoir', 'faire', 'dire', 'aller', 'voir',
    'comment', 'pourquoi', 'quand', 'si', 'oui', 'non', 'pas'
  ];
  
  return text
    .split(' ')
    .filter(word => word.length > 2 && !stopWords.includes(word));
};

/**
 * Corrige les problèmes d'encodage dans le texte
 * @param {string} text - Le texte à corriger
 * @returns {string} Le texte avec encodage corrigé
 */
export const fixEncoding = (text) => {
  if (!text) return '';
  
  // Remplacer les caractères mal encodés courants
  return text
  .replace(/Ã©/g, 'é')
  .replace(/Ã¨/g, 'è')
  .replace(/Ã /g, 'à')
  .replace(/Ã§/g, 'ç')
  .replace(/Ã´/g, 'ô')
  .replace(/Ã»/g, 'û')
  .replace(/Ã®/g, 'î')
  .replace(/Ã«/g, 'ë')
  .replace(/Ã¯/g, 'ï')
  .replace(/Ã¢/g, 'â')
  .replace(/Ã¹/g, 'ù')
  .replace(/Ãª/g, 'ê')
  .replace(/Ã‰/g, 'É')
  .replace(/Ã‹/g, 'Ë')
  .replace(/Ãš/g, 'Ú')
  .replace(/â/g, "'")  // Apostrophe mal encodée
  .replace(/â/g, "'")  // Apostrophe gauche mal encodée
  .replace(/â/g, "-")  // Tiret mal encodé
  .replace(/â¦/g, "...") // Points de suspension mal encodés
  .replace(/Â/g, "") // Supprime les "Â" parasites
  .replace(/´┐¢/g, "ô")
  .replace(/´┐¼/g, "û")
  .replace(/´┐«/g, "à")
  .replace(/´┐ª/g, "è")
  .replace(/´┐©/g, "é")
  .replace(/´┐¯/g, "î")
  .replace(/´┐¶/g, "ë")
  .replace(/’/g, "'") // Remplace l'apostrophe mal encodée
  .replace(/´/g, "'")  // Remplace les apostrophes accentuées mal encodées
  .replace(/`/g, "'"); // Remplace les apostrophes inversées mal encodées
};