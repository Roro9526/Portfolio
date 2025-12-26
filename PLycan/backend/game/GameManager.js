import { GameLogic } from './GameLogic.js';

class GameManager {
    constructor() {
        this.games = new Map(); // roomCode -> GameLogic
    }

    // Génère un code de partie unique
    generateRoomCode() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code;
        do {
            code = '';
            for (let i = 0; i < 6; i++) {
                code += characters.charAt(Math.floor(Math.random() * characters.length));
            }
        } while (this.games.has(code));
        return code;
    }

    // Crée une nouvelle partie
    createGame(hostId, hostName) {
        const roomCode = this.generateRoomCode();
        const game = new GameLogic(roomCode, hostId, hostName);
        this.games.set(roomCode, game);
        return { roomCode, game };
    }

    // Récupère une partie par son code
    getGame(roomCode) {
        return this.games.get(roomCode);
    }

    // Rejoint une partie
    joinGame(roomCode, playerId, playerName) {
        const game = this.games.get(roomCode);
        if (!game) {
            return { success: false, error: 'Partie introuvable' };
        }
        if (game.status !== 'lobby') {
            return { success: false, error: 'La partie a déjà commencé' };
        }
        if (game.players.length >= 20) {
            return { success: false, error: 'La partie est pleine' };
        }

        game.addPlayer(playerId, playerName);
        return { success: true, game };
    }

    // Supprime une partie
    removeGame(roomCode) {
        this.games.delete(roomCode);
    }

    // Retire un joueur d'une partie
    removePlayer(roomCode, playerId) {
        const game = this.games.get(roomCode);
        if (!game) return;

        game.removePlayer(playerId);

        // Si plus de joueurs, supprimer la partie
        if (game.players.length === 0) {
            this.removeGame(roomCode);
            return { gameDeleted: true };
        }

        // Si l'hôte part, transférer à un autre joueur
        if (game.hostId === playerId && game.players.length > 0) {
            game.hostId = game.players[0].id;
            return { newHostId: game.hostId };
        }

        return { gameDeleted: false };
    }

    // Récupère toutes les parties actives
    getActiveGames() {
        return Array.from(this.games.values()).map(game => ({
            roomCode: game.roomCode,
            playerCount: game.players.length,
            status: game.status
        }));
    }
}

export const gameManager = new GameManager();
