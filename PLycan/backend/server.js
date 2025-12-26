import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { gameManager } from './game/GameManager.js';
import { ROLES, TEAMS } from './game/roles.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Permettre toutes les origines pour le jeu en réseau
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Stockage des sockets par joueur
const playerSockets = new Map(); // playerId -> socketId

// ==================== SOCKET.IO EVENTS ====================

io.on('connection', (socket) => {
    console.log(`Nouveau client connecté: ${socket.id}`);

    // Créer une partie
    socket.on('createGame', ({ playerName }) => {
        const { roomCode, game } = gameManager.createGame(socket.id, playerName);
        playerSockets.set(socket.id, socket.id);

        socket.join(roomCode);
        socket.emit('gameCreated', {
            roomCode,
            gameState: game.getGameStateForPlayer(socket.id)
        });

        console.log(`Partie créée: ${roomCode} par ${playerName}`);
    });

    // Rejoindre une partie
    socket.on('joinGame', ({ roomCode, playerName }) => {
        const result = gameManager.joinGame(roomCode, socket.id, playerName);

        if (!result.success) {
            socket.emit('error', { message: result.error });
            return;
        }

        playerSockets.set(socket.id, socket.id);
        socket.join(roomCode);

        // Informer tous les joueurs
        io.to(roomCode).emit('playerJoined', {
            gameState: result.game.getPublicGameState()
        });

        // Envoyer l'état au nouveau joueur
        socket.emit('joinedGame', {
            gameState: result.game.getGameStateForPlayer(socket.id)
        });

        console.log(`${playerName} a rejoint la partie ${roomCode}`);
    });

    // Mettre à jour la configuration des rôles
    socket.on('updateRoles', ({ roomCode, roleConfig }) => {
        const game = gameManager.getGame(roomCode);
        if (!game || game.hostId !== socket.id) {
            socket.emit('error', { message: 'Non autorisé' });
            return;
        }

        game.updateRoleConfig(roleConfig);
        io.to(roomCode).emit('rolesUpdated', {
            roleConfig: game.roleConfig
        });
    });

    // Démarrer la partie
    socket.on('startGame', ({ roomCode }) => {
        const game = gameManager.getGame(roomCode);
        if (!game || game.hostId !== socket.id) {
            socket.emit('error', { message: 'Non autorisé' });
            return;
        }

        const result = game.startGame();
        if (!result.success) {
            socket.emit('error', { message: result.error });
            return;
        }

        // Envoyer à chaque joueur son rôle
        game.players.forEach(player => {
            const playerSocket = io.sockets.sockets.get(player.id);
            if (playerSocket) {
                playerSocket.emit('gameStarted', {
                    gameState: game.getGameStateForPlayer(player.id)
                });
            }
        });

        // Commencer la première nuit
        setTimeout(() => {
            startNightPhase(roomCode);
        }, 3000);

        console.log(`Partie ${roomCode} démarrée`);
    });

    // Action de nuit
    socket.on('nightAction', ({ roomCode, action }) => {
        const game = gameManager.getGame(roomCode);
        if (!game || game.status !== 'playing' || game.phase !== 'night') {
            return;
        }

        const result = game.registerNightAction(socket.id, action);

        if (result.success) {
            socket.emit('actionRegistered', { success: true });

            // Si c'est la voyante, envoyer la vision immédiatement
            if (game.players.find(p => p.id === socket.id)?.role === ROLES.VOYANTE.id) {
                // On récupère la cible directement depuis l'action
                const targetId = action.target;
                const target = game.players.find(p => p.id === targetId);
                if (target) {
                    socket.emit('seerVision', {
                        targetId,
                        targetName: target.name,
                        role: target.role
                    });
                }
            }

            // Vérifier si on peut passer à l'étape suivante (Auto-Skip)
            const timeoutData = gameTimeouts.get(roomCode);
            if (timeoutData) {
                // Vérifier si tous les joueurs DU RÔLE ACTUEL ont joué
                // On doit savoir quel est le rôle actuel. 
                // Simplification: on vérifie via game.nightActions si tous les joueurs de ce rôle ont une entrée

                // Note: C'est un peu heuristique car game.nightActions contient tout le monde.
                // Mais comme on appelle activateNextRole séquentiellement, ça devrait aller si on filtre par le rôle en cours.
                // Le timeoutData ne stocke pas le rôle en cours... on devrait peut-être le stocker.
                // Pour l'instant, faisons une vérification générique sur les joueurs actifs

                // Pour faire propre, on va modifier activateNightRoles pour stocker le roleId en cours dans gameTimeouts
                if (timeoutData.roleId) {
                    const playersOfRole = game.players.filter(p => p.alive && p.role === timeoutData.roleId);
                    const allActed = playersOfRole.every(p => game.nightActions[p.id]);

                    if (allActed) {
                        clearTimeout(timeoutData.timeout);
                        timeoutData.triggerNext();
                    }
                }
            }
        }
    });

    // Vote de jour
    socket.on('dayVote', ({ roomCode, targetId }) => {
        const game = gameManager.getGame(roomCode);
        if (!game || game.status !== 'playing' || game.phase !== 'day') {
            return;
        }

        const result = game.registerDayVote(socket.id, targetId);

        if (result.success) {
            socket.emit('voteRegistered', { success: true });

            // Informer tous les joueurs du nombre de votes
            const voteCount = Object.keys(game.dayVotes).length;
            const aliveCount = game.getAlivePlayers().length;

            io.to(roomCode).emit('voteUpdate', {
                voteCount,
                totalVotes: aliveCount
            });

            // Vérifier si tous ont voté
            if (voteCount === aliveCount) {
                // Nettoyer le timeout de jour
                const timeoutData = gameTimeouts.get(roomCode);
                if (timeoutData) {
                    clearTimeout(timeoutData.timeout);
                    gameTimeouts.delete(roomCode);
                }
                resolveDayVote(roomCode);
            }
        }
    });

    // Action du chasseur
    socket.on('hunterKill', ({ roomCode, targetId }) => {
        const game = gameManager.getGame(roomCode);
        if (!game) return;

        const player = game.players.find(p => p.id === socket.id);
        if (!player || player.role !== ROLES.CHASSEUR.id || player.alive) {
            return;
        }

        const result = game.hunterKill(targetId);

        io.to(roomCode).emit('hunterKilled', {
            hunterId: socket.id,
            victim: result.victim,
            loverDied: result.loverDied
        });

        // Vérifier victoire
        checkGameEnd(roomCode);
    });

    // Passer le tour (réduire le temps d'attente)
    socket.on('skipTurn', ({ roomCode }) => {
        const game = gameManager.getGame(roomCode);
        if (!game) return;

        // Vérifier si c'est le tour du joueur
        const timeoutData = gameTimeouts.get(roomCode);
        if (timeoutData && (game.phase === 'night' || game.phase === 'day')) {
            clearTimeout(timeoutData.timeout);
            timeoutData.triggerNext();
        }
    });

    // Déconnexion
    socket.on('disconnect', () => {
        console.log(`Client déconnecté: ${socket.id}`);

        // Trouver la partie du joueur
        for (const [roomCode, game] of gameManager.games) {
            const player = game.players.find(p => p.id === socket.id);
            if (player) {
                const result = gameManager.removePlayer(roomCode, socket.id);

                if (result.gameDeleted) {
                    io.to(roomCode).emit('gameDeleted', { message: 'La partie a été supprimée' });
                } else if (result.newHostId) {
                    io.to(roomCode).emit('newHost', {
                        newHostId: result.newHostId,
                        gameState: game.getPublicGameState()
                    });
                } else {
                    io.to(roomCode).emit('playerLeft', {
                        playerId: socket.id,
                        gameState: game.getPublicGameState()
                    });
                }

                // Si victoire suite à la déconnexion
                const winCondition = game.checkWinCondition();
                if (winCondition) {
                    endGame(roomCode, winCondition);
                }

                break;
            }
        }

        playerSockets.delete(socket.id);
    });
});

// ==================== HELPER FUNCTIONS ====================

function startNightPhase(roomCode) {
    const game = gameManager.getGame(roomCode);
    if (!game) return;

    game.phase = 'night';

    io.to(roomCode).emit('phaseChanged', {
        phase: 'night',
        round: game.round
    });

    // Activer les rôles dans l'ordre
    activateNightRoles(roomCode);
}

// État des timeouts par salle
const gameTimeouts = new Map(); // roomCode -> { timeout, triggerNext, endTime, roleId }

function activateNightRoles(roomCode) {
    const game = gameManager.getGame(roomCode);
    if (!game) return;

    // Ordre des rôles la nuit
    const nightRoles = [
        game.round === 1 ? ROLES.CUPIDON.id : null,
        ROLES.LOUP_GAROU.id,
        ROLES.VOYANTE.id,
        ROLES.SORCIERE.id
    ].filter(Boolean);

    let currentRoleIndex = 0;

    function activateNextRole() {
        if (currentRoleIndex >= nightRoles.length) {
            // Toutes les actions de nuit complètes
            gameTimeouts.delete(roomCode);
            resolveNightActions(roomCode);
            return;
        }

        const roleId = nightRoles[currentRoleIndex];
        const playersWithRole = game.players.filter(p => p.alive && p.role === roleId);

        // Durée du tour (30s loups, 20s autres)
        const duration = roleId === ROLES.LOUP_GAROU.id ? 30000 : 20000;
        const endTime = Date.now() + duration;

        // Fonction pour passer à l'étape suivante
        const triggerNext = () => {
            currentRoleIndex++;
            activateNextRole();
        };

        if (playersWithRole.length > 0) {
            const payload = {
                role: roleId,
                players: playersWithRole.map(p => p.id),
                endTime: endTime // Pour le timer
            };

            // Info spéciale pour la sorcière
            if (roleId === ROLES.SORCIERE.id) {
                const victimId = game.getProvisionalWerewolfVictim();
                if (victimId) {
                    payload.victimId = victimId;
                }
            }

            io.to(roomCode).emit('roleAction', payload);

            // Programmer le timeout
            const timeoutId = setTimeout(() => {
                triggerNext();
            }, duration);

            // Stocker pour pouvoir annuler/skipper
            gameTimeouts.set(roomCode, {
                timeout: timeoutId,
                triggerNext: triggerNext,
                endTime: endTime,
                roleId: roleId // Important pour auto-skip
            });
        } else {
            // Personne avec ce rôle, passer au suivant
            currentRoleIndex++;
            activateNextRole();
        }
    }

    activateNextRole();
}

function resolveNightActions(roomCode) {
    const game = gameManager.getGame(roomCode);
    if (!game) return;

    const results = game.resolveNightActions();
    const publicState = game.getPublicGameState();

    // Envoyer les résultats
    io.to(roomCode).emit('nightResults', {
        deaths: results.deaths,
        lovers: results.lovers,
        players: publicState.players
    });

    // Envoyer la vision de la voyante si applicablenvoyée au moment de l'action, mais on peut la renvoyer ici au cas où)
    // Mais on l'a fait plus haut "immédiatement".

    // Vérifier si le chasseur est mort
    const hunterDied = results.deaths.some(playerId => {
        const player = game.players.find(p => p.id === playerId);
        return player?.role === ROLES.CHASSEUR.id;
    });

    if (hunterDied) {
        setTimeout(() => {
            io.to(roomCode).emit('hunterTurn', {
                message: 'Le chasseur doit choisir sa cible'
            });
        }, 3000);
        return;
    }

    // Vérifier victoire
    const winCondition = game.checkWinCondition();
    if (winCondition) {
        endGame(roomCode, winCondition);
        return;
    }

    // Passer au jour
    setTimeout(() => {
        startDayPhase(roomCode);
    }, 5000);
}

function startDayPhase(roomCode) {
    const game = gameManager.getGame(roomCode);
    if (!game) return;

    game.changePhase();

    // Durée du jour (60s)
    const duration = 60000;
    const endTime = Date.now() + duration;

    // Envoyer l'état public mis à jour (pour les morts)
    // On ne peut pas facilement envoyer getGameStateForPlayer à tout le monde en broadcast
    // Mais on peut envoyer la liste des joueurs public
    const publicState = game.getPublicGameState();

    io.to(roomCode).emit('phaseChanged', {
        phase: 'day',
        round: game.round,
        endTime: endTime, // Pour le timer
        players: publicState.players
    });

    const triggerResolve = () => {
        gameTimeouts.delete(roomCode);
        resolveDayVote(roomCode);
    };

    // Auto-résoudre après un timer (60 secondes)
    const timeoutId = setTimeout(triggerResolve, duration);

    // Stocker le timeout pour pouvoir le clear si tout le monde a voté
    gameTimeouts.set(roomCode, {
        timeout: timeoutId,
        triggerNext: triggerResolve, // skipTurn peut aussi appeler ça pour finir la journée
        endTime: endTime
    });
}

function resolveDayVote(roomCode) {
    const game = gameManager.getGame(roomCode);
    if (!game || game.phase !== 'day') return;

    const result = game.resolveDayVote();
    const publicState = game.getPublicGameState();

    io.to(roomCode).emit('dayResults', {
        victim: result.victim,
        loverDied: result.loverDied,
        players: publicState.players
    });

    // Vérifier si le chasseur est mort
    if (result.victim) {
        const victim = game.players.find(p => p.id === result.victim);
        if (victim?.role === ROLES.CHASSEUR.id) {
            setTimeout(() => {
                io.to(roomCode).emit('hunterTurn', {
                    hunterId: result.victim
                });
            }, 3000);
            return;
        }
    }

    // Vérifier victoire
    checkGameEnd(roomCode);
}

import mongoose from 'mongoose';
import User from './models/User.js';

// Connexion MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/loup-garou';
mongoose.connect(mongoURI)
    .then(async () => {
        console.log('✅ Connecté à MongoDB');
        // Seeder des données de test si vide
        const count = await User.countDocuments();
        if (count === 0) {
            console.log('🌱 Seeding de données de test...');
            await User.insertMany([
                { name: 'AlphaWolf', score: 10, gamesPlayed: 5 },
                { name: 'VillageElder', score: 5, gamesPlayed: 3 },
                { name: 'RedHood', score: 8, gamesPlayed: 4 }
            ]);
            console.log('✨ Données de test insérées !');
        }
    })
    .catch(err => {
        console.error('❌ Erreur connexion MongoDB:', err);
        console.log('💡 Note: Assurez-vous que MongoDB tourne localement ou via Docker.');
    });

async function updateScores(players, winners, winningTeam) {
    for (const player of players) {
        let points = 0;

        // Logique de points
        if (winningTeam === TEAMS.LOUPS) {
            if (player.role === ROLES.LOUP_GAROU.id) {
                points = 2; // Victoire Loup
            } else {
                points = -1; // Défaite Villageois
            }
        } else if (winningTeam === TEAMS.VILLAGE) {
            if (player.role !== ROLES.LOUP_GAROU.id) {
                points = 1; // Victoire Villageois
            } else {
                points = -1; // Défaite Loup
            }
        } else if (winningTeam === TEAMS.AMOUREUX) {
            // Cas particulier, disons +2 pour les amoureux
            if (winners.includes(player.id)) points = 2;
            else points = -1;
        }

        try {
            await User.findOneAndUpdate(
                { name: player.name },
                {
                    $inc: { score: points, gamesPlayed: 1 },
                    $set: { lastPlayed: Date.now() }
                },
                { upsert: true, new: true }
            );
            console.log(`Score mis à jour pour ${player.name}: ${points > 0 ? '+' : ''}${points}`);
        } catch (error) {
            console.error(`Erreur mise à jour score pour ${player.name}:`, error);
        }
    }
}

// Fonction pour arrêter proprement le serveur
function stopServer() {
    io.close(() => {
        console.log('Serveur Socket.IO arrêté');
        server.close(() => {
            console.log('Serveur HTTP arrêté');
            mongoose.disconnect();
            process.exit(0);
        });
    });
}
// Vérifie la fin du jeu ou passe au tour suivant
function checkGameEnd(roomCode) {
    const game = gameManager.getGame(roomCode);
    if (!game) return;

    const winCondition = game.checkWinCondition();
    if (winCondition) {
        endGame(roomCode, winCondition);
    } else {
        // Si on est en jour, on passe à la nuit
        if (game.phase === 'day') {
            setTimeout(() => {
                startNightPhase(roomCode);
            }, 5000);
        }
    }
}

function endGame(roomCode, winCondition) {
    const game = gameManager.getGame(roomCode);
    if (!game) return;

    game.status = 'ended';

    // Calculer les points pour l'affichage immédiat
    const playerResults = game.players.map(player => {
        let points = 0;
        const winningTeam = winCondition.winner;
        const winners = winCondition.lovers || [];

        if (winningTeam === TEAMS.LOUPS) {
            points = (player.role === ROLES.LOUP_GAROU.id) ? 2 : -1;
        } else if (winningTeam === TEAMS.VILLAGE) {
            points = (player.role !== ROLES.LOUP_GAROU.id) ? 1 : -1;
        } else if (winningTeam === TEAMS.AMOUREUX) {
            points = winners.includes(player.id) ? 2 : -1;
        }

        return {
            id: player.id,
            name: player.name,
            role: player.role,
            alive: player.alive,
            gain: points
        };
    });

    io.to(roomCode).emit('gameOver', {
        winner: winCondition.winner,
        lovers: winCondition.lovers || [],
        players: playerResults
    });

    console.log(`Partie ${roomCode} terminée, vainqueur: ${winCondition.winner}`);

    // Sauvegarder les scores
    updateScores(game.players, winCondition.lovers || [], winCondition.winner);

    // Supprimer la partie après un délai
    setTimeout(() => {
        gameManager.removeGame(roomCode);
    }, 30000);
}

// ==================== HTTP ENDPOINTS ====================

app.get('/', (req, res) => {
    res.json({ message: 'Serveur Loup-Garou actif' });
});

app.get('/games', (req, res) => {
    res.json(gameManager.getActiveGames());
});

app.get('/leaderboard', async (req, res) => {
    try {
        const users = await User.find().sort({ score: -1 }).limit(10);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Erreur récupération leaderboard' });
    }
});

// ==================== START SERVER ====================

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🐺 Serveur Loup-Garou démarré sur le port ${PORT}`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://<votre-ip>:${PORT}`);
});
