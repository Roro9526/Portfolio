export const cleanInput = (input) => {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9éèêëàâäôöûüç\s]/gi, '')
    .trim();
};

export const extractWords = (cleanedInput) => {
  return cleanedInput
    .split(' ')
    .map(word => word.replace(/[^a-z0-9éèêëàâäôöûüç]/g, ''))
    .filter(word => word.length > 2);
};

export const fixEncoding = (text) => {
  // Remplacer les séquences d'encodage erronées par les bons caractères
  return text
    .replace(/├®/g, 'é')  // Correction pour é
    .replace(/├á/g, 'à')  // Correction pour à
    .replace(/├º/g, 'ç')  // Correction pour ç
    .replace(/├╣/g, 'ù')  // Correction pour ù
    .replace(/├¿/g, 'è')  // Correction pour è
    .replace(/├é/g, 'é')  // Correction pour é
    .replace(/├ô/g, 'ô')  // Correction pour ô
    .replace(/├Ç/g, 'Ç')  // Correction pour Ç
    .replace(/├¦/g, 'è')  // Correction pour è
    .replace(/├ç/g, 'ç')  // Correction pour ç
    .replace(/├Ä/g, 'à')  // Correction pour à
    .replace(/├ñ/g, 'ñ')  // Correction pour ñ
    .replace(/¬/g, 'œ')   // Correction pour œ
    .replace(/├ö/g, 'ö')  // Correction pour ö
    .replace(/├ï/g, 'î')  // Correction pour î
    .replace(/├û/g, 'û')  // Correction pour û
    .replace(/┬ç/g, 'œ')  // Correction pour œ
    .replace(/├ò/g, 'ò')  // Correction pour ò
    .replace(/├ü/g, 'ü')  // Correction pour ü
    .replace(/├ø/g, 'ø')  // Correction pour ø
    .replace(/┬¬/g, 'é')  // Correction pour é
    .replace(/┼½/g, 'è')  // Correction pour è
    .replace(/┼¼/g, 'ë')  // Correction pour ë
    .replace(/┼¡/g, 'î'); // Correction pour î
};