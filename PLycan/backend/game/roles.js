export const ROLES = {
  VILLAGEOIS: {
    id: 'villageois',
    name: 'Villageois',
    team: 'village',
    description: 'Un simple villageois sans pouvoir spécial',
    nightAction: false,
    order: 999
  },
  LOUP_GAROU: {
    id: 'loup-garou',
    name: 'Loup-Garou',
    team: 'loups',
    description: 'Vote pour tuer un villageois chaque nuit',
    nightAction: true,
    order: 3
  },
  VOYANTE: {
    id: 'voyante',
    name: 'Voyante',
    team: 'village',
    description: 'Peut découvrir le rôle d\'un joueur chaque nuit',
    nightAction: true,
    order: 4
  },
  SORCIERE: {
    id: 'sorciere',
    name: 'Sorcière',
    team: 'village',
    description: 'Possède 2 potions: une de vie et une de mort (utilisables 1 fois)',
    nightAction: true,
    order: 5,
    potions: {
      life: 1,
      death: 1
    }
  },
  CUPIDON: {
    id: 'cupidon',
    name: 'Cupidon',
    team: 'village',
    description: 'Désigne 2 amoureux au premier tour (ils meurent ensemble)',
    nightAction: true,
    order: 1,
    firstNightOnly: true
  },
  CHASSEUR: {
    id: 'chasseur',
    name: 'Chasseur',
    team: 'village',
    description: 'Quand il meurt, il peut tuer un autre joueur',
    nightAction: false,
    order: 999,
    onDeath: true
  }
};

export const TEAMS = {
  VILLAGE: 'village',
  LOUPS: 'loups',
  AMOUREUX: 'amoureux'
};

// Retourne la configuration de rôle par ID
export function getRoleById(roleId) {
  return Object.values(ROLES).find(role => role.id === roleId);
}

// Vérifie si un rôle a une action de nuit
export function hasNightAction(roleId) {
  const role = getRoleById(roleId);
  return role?.nightAction || false;
}

// Retourne l'équipe d'un rôle
export function getRoleTeam(roleId) {
  const role = getRoleById(roleId);
  return role?.team || TEAMS.VILLAGE;
}
