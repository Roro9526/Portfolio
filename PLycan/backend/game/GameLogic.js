import { ROLES, TEAMS, getRoleById, getRoleTeam } from './roles.js';

export class GameLogic {
    constructor(roomCode, hostId, hostName) {
        this.roomCode = roomCode;
        this.hostId = hostId;
        this.status = 'lobby'; // lobby, playing, ended
        this.players = [];
        this.roleConfig = {
            [ROLES.LOUP_GAROU.id]: 2,
            [ROLES.VOYANTE.id]: 1,
            [ROLES.SORCIERE.id]: 1,
            [ROLES.CUPIDON.id]: 0,
            [ROLES.CHASSEUR.id]: 0,
            [ROLES.VILLAGEOIS.id]: 3
        };
        this.phase = 'night'; // night, day
        this.round = 0;
        this.currentRole = null;
        this.nightActions = {};
        this.dayVotes = {};
        this.lovers = [];
        this.deadPlayers = [];

        // Ajouter l'hôte
        this.addPlayer(hostId, hostName);
    }

    // Ajoute un joueur
    addPlayer(playerId, playerName) {
        if (this.players.find(p => p.id === playerId)) return;

        this.players.push({
            id: playerId,
            name: playerName,
            role: null,
            alive: true,
            isHost: playerId === this.hostId,
            potions: null // Pour la sorcière
        });
    }

    // Retire un joueur
    removePlayer(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
    }

    // Met à jour la configuration des rôles
    updateRoleConfig(roleConfig) {
        this.roleConfig = roleConfig;
    }

    // Distribue les rôles aléatoirement
    assignRoles() {
        const roles = [];

        // Créer un tableau avec tous les rôles
        Object.entries(this.roleConfig).forEach(([roleId, count]) => {
            for (let i = 0; i < count; i++) {
                roles.push(roleId);
            }
        });

        // Mélanger les rôles
        for (let i = roles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [roles[i], roles[j]] = [roles[j], roles[i]];
        }

        // Assigner aux joueurs
        this.players.forEach((player, index) => {
            player.role = roles[index];

            // Initialiser les potions pour la sorcière
            if (player.role === ROLES.SORCIERE.id) {
                player.potions = { life: 1, death: 1 };
            }
        });
    }

    // Démarre la partie
    startGame() {
        if (this.players.length < 4) {
            return { success: false, error: 'Minimum 4 joueurs requis' };
        }

        const totalRoles = Object.values(this.roleConfig).reduce((a, b) => a + b, 0);
        if (totalRoles !== this.players.length) {
            return { success: false, error: 'Le nombre de rôles doit correspondre au nombre de joueurs' };
        }

        this.assignRoles();
        this.status = 'playing';
        this.round = 1;
        this.phase = 'night';

        return { success: true };
    }

    // Récupère les joueurs vivants
    getAlivePlayers() {
        return this.players.filter(p => p.alive);
    }

    // Récupère les loups-garous vivants
    getAliveWerewolves() {
        return this.players.filter(p => p.alive && p.role === ROLES.LOUP_GAROU.id);
    }

    // Récupère les villageois vivants (non loups)
    getAliveVillagers() {
        return this.players.filter(p => p.alive && p.role !== ROLES.LOUP_GAROU.id);
    }

    // Enregistre une action de nuit
    registerNightAction(playerId, action) {
        const player = this.players.find(p => p.id === playerId);
        if (!player || !player.alive) return { success: false };

        this.nightActions[playerId] = action;
        return { success: true };
    }

    // Enregistre un vote de jour
    registerDayVote(playerId, targetId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player || !player.alive) return { success: false };

        this.dayVotes[playerId] = targetId;
        return { success: true };
    }

    // Calcule la victime provisoire des loups (pour la sorcière)
    getProvisionalWerewolfVictim() {
        const werewolfVotes = {};
        this.getAliveWerewolves().forEach(wolf => {
            if (this.nightActions[wolf.id]) {
                const target = this.nightActions[wolf.id].target;
                werewolfVotes[target] = (werewolfVotes[target] || 0) + 1;
            }
        });

        if (Object.keys(werewolfVotes).length > 0) {
            return Object.entries(werewolfVotes)
                .sort((a, b) => b[1] - a[1])[0][0];
        }
        return null;
    }

    // Résout les actions de nuit
    resolveNightActions() {
        const results = {
            werewolfVictim: null,
            seerCheck: null,
            witchSaved: null,
            witchKilled: null,
            lovers: [],
            deaths: []
        };

        // Cupidon (première nuit seulement)
        if (this.round === 1) {
            const cupidon = this.players.find(p => p.role === ROLES.CUPIDON.id);
            if (cupidon && this.nightActions[cupidon.id]) {
                this.lovers = this.nightActions[cupidon.id].targets || [];
                results.lovers = this.lovers;
            }
        }

        // Récupérer la victime des loups
        results.werewolfVictim = this.getProvisionalWerewolfVictim();

        // Voyante
        const seer = this.players.find(p => p.role === ROLES.VOYANTE.id && p.alive);
        if (seer && this.nightActions[seer.id]) {
            const targetId = this.nightActions[seer.id].target;
            const target = this.players.find(p => p.id === targetId);
            if (target) {
                results.seerCheck = {
                    targetId,
                    targetName: target.name,
                    role: target.role
                };
            }
        }

        // Sorcière
        const witch = this.players.find(p => p.role === ROLES.SORCIERE.id && p.alive);
        if (witch && this.nightActions[witch.id]) {
            const action = this.nightActions[witch.id];

            // Potion de vie
            if (action.saveTarget && witch.potions.life > 0) {
                results.witchSaved = action.saveTarget;
                witch.potions.life = 0;

                // Annuler la mort du loup si sauvé
                if (results.werewolfVictim === action.saveTarget) {
                    results.werewolfVictim = null;
                }
            }

            // Potion de mort
            if (action.killTarget && witch.potions.death > 0) {
                results.witchKilled = action.killTarget;
                witch.potions.death = 0;
            }
        }

        // Calculer les morts
        if (results.werewolfVictim) {
            results.deaths.push(results.werewolfVictim);
        }
        if (results.witchKilled) {
            results.deaths.push(results.witchKilled);
        }

        // Appliquer les morts
        results.deaths.forEach(playerId => {
            this.killPlayer(playerId);
        });

        // Vérifier si un amoureux est mort (l'autre meurt aussi)
        if (this.lovers.length === 2) {
            const lover1Dead = !this.players.find(p => p.id === this.lovers[0])?.alive;
            const lover2Dead = !this.players.find(p => p.id === this.lovers[1])?.alive;

            if (lover1Dead && !lover2Dead) {
                this.killPlayer(this.lovers[1]);
                results.deaths.push(this.lovers[1]);
            } else if (lover2Dead && !lover1Dead) {
                this.killPlayer(this.lovers[0]);
                results.deaths.push(this.lovers[0]);
            }
        }

        // Réinitialiser les actions de nuit
        this.nightActions = {};

        return results;
    }

    // Résout le vote de jour
    resolveDayVote() {
        const votes = {};

        Object.values(this.dayVotes).forEach(targetId => {
            votes[targetId] = (votes[targetId] || 0) + 1;
        });

        let victim = null;
        if (Object.keys(votes).length > 0) {
            // Trouver le joueur avec le plus de votes
            const sorted = Object.entries(votes).sort((a, b) => b[1] - a[1]);

            // Vérifier s'il n'y a pas d'égalité
            if (sorted.length === 1 || sorted[0][1] > sorted[1][1]) {
                victim = sorted[0][0];
                this.killPlayer(victim);
            }
        }

        // Vérifier si un amoureux est mort
        const loverDied = this.checkLoverDeath(victim);

        // Réinitialiser les votes
        this.dayVotes = {};

        return { victim, loverDied };
    }

    // Tue un joueur
    killPlayer(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            player.alive = false;
            this.deadPlayers.push(playerId);
        }
    }

    // Vérifie si un amoureux est mort (tue l'autre)
    checkLoverDeath(deadPlayerId) {
        if (this.lovers.length !== 2 || !deadPlayerId) return null;

        if (this.lovers.includes(deadPlayerId)) {
            const otherLover = this.lovers.find(id => id !== deadPlayerId);
            const otherPlayer = this.players.find(p => p.id === otherLover);

            if (otherPlayer?.alive) {
                this.killPlayer(otherLover);
                return otherLover;
            }
        }

        return null;
    }

    // Vérifie les conditions de victoire
    checkWinCondition() {
        const aliveWerewolves = this.getAliveWerewolves();
        const aliveVillagers = this.getAliveVillagers();

        // Vérifier victoire des amoureux
        if (this.lovers.length === 2) {
            const alivePlayers = this.getAlivePlayers();
            if (alivePlayers.length === 2 &&
                this.lovers.every(id => alivePlayers.find(p => p.id === id))) {
                return { winner: TEAMS.AMOUREUX, lovers: this.lovers };
            }
        }

        // Vérifier victoire des loups
        if (aliveWerewolves.length >= aliveVillagers.length) {
            return { winner: TEAMS.LOUPS };
        }

        // Vérifier victoire du village
        if (aliveWerewolves.length === 0) {
            return { winner: TEAMS.VILLAGE };
        }

        return null;
    }

    // Change la phase (nuit/jour)
    changePhase() {
        if (this.phase === 'night') {
            this.phase = 'day';
        } else {
            this.phase = 'night';
            this.round++;
        }
    }

    // Action du chasseur quand il meurt
    hunterKill(targetId) {
        this.killPlayer(targetId);
        const loverDied = this.checkLoverDeath(targetId);
        return { victim: targetId, loverDied };
    }

    // Récupère l'état du jeu pour un joueur spécifique
    getGameStateForPlayer(playerId) {
        const player = this.players.find(p => p.id === playerId);

        return {
            roomCode: this.roomCode,
            status: this.status,
            phase: this.phase,
            round: this.round,
            myRole: player?.role,
            myPotions: player?.potions,
            isAlive: player?.alive,
            isHost: player?.id === this.hostId,
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                alive: p.alive,
                isHost: p.id === this.hostId,
                // Ne révéler le rôle que si le joueur est mort ou si c'est un loup qui regarde d'autres loups
                role: !p.alive || (player?.role === ROLES.LOUP_GAROU.id && p.role === ROLES.LOUP_GAROU.id)
                    ? p.role
                    : null
            })),
            lovers: this.lovers.includes(playerId) ? this.lovers : []
        };
    }

    // Récupère l'état public du jeu
    getPublicGameState() {
        return {
            roomCode: this.roomCode,
            status: this.status,
            hostId: this.hostId,
            playerCount: this.players.length,
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                isHost: p.id === this.hostId,
                alive: p.alive,
                role: !p.alive ? p.role : null // Révéler le rôle des morts
            })),
            roleConfig: this.roleConfig
        };
    }
}
