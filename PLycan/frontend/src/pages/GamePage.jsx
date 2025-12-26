import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import PlayerCard from '../components/PlayerCard';
import GameOverModal from '../components/GameOverModal';
import './GamePage.css';

const ROLE_INFO = {
    'loup-garou': { name: 'Loup-Garou', emoji: '🐺', color: '#8B0000' },
    'voyante': { name: 'Voyante', emoji: '🔮', color: '#6C63FF' },
    'sorciere': { name: 'Sorcière', emoji: '🧪', color: '#228B22' },
    'cupidon': { name: 'Cupidon', emoji: '💘', color: '#FF69B4' },
    'chasseur': { name: 'Chasseur', emoji: '🏹', color: '#CD853F' },
    'villageois': { name: 'Villageois', emoji: '👤', color: '#4169E1' }
};

function GamePage() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { socket } = useSocket();

    // Initialiser avec gameState si passé via navigation
    const [gameState, setGameState] = useState(location.state?.gameState || null);
    const [phase, setPhase] = useState(location.state?.gameState?.phase || 'night');
    const [round, setRound] = useState(location.state?.gameState?.round || 1);
    const [currentAction, setCurrentAction] = useState(null);
    const [selectedTarget, setSelectedTarget] = useState(null);
    const [selectedTargets, setSelectedTargets] = useState([]);
    const [message, setMessage] = useState(
        location.state?.gameState?.myRole
            ? `🎭 Votre rôle : ${ROLE_INFO[location.state.gameState.myRole]?.name} ${ROLE_INFO[location.state.gameState.myRole]?.emoji}`
            : ''
    );
    const [voteCount, setVoteCount] = useState(0);
    const [seerVision, setSeerVision] = useState(null);
    const [gameOver, setGameOver] = useState(null);
    const [nightResults, setNightResults] = useState(null);
    const [dayResults, setDayResults] = useState(null);
    const [witchOptions, setWitchOptions] = useState({ canSave: false, canKill: false });

    // Timer state
    const [endTime, setEndTime] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);

    const myRole = gameState?.myRole;
    const myPotions = gameState?.myPotions;
    const isAlive = gameState?.isAlive;

    useEffect(() => {
        let interval;
        if (endTime) {
            interval = setInterval(() => {
                const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
                setTimeLeft(remaining);
                if (remaining <= 0) {
                    setEndTime(null);
                }
            }, 1000);
        } else {
            setTimeLeft(0);
        }
        return () => clearInterval(interval);
    }, [endTime]);

    const updatePlayers = (newPlayers) => {
        if (!newPlayers) return;
        setGameState(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                players: newPlayers.map(np => {
                    const oldP = prev.players.find(p => p.id === np.id);
                    return {
                        ...np,
                        // Conserver le rôle connu s'il n'est pas révélé dans la nouvelle mise à jour (pour les loups entre eux)
                        role: np.role || (oldP ? oldP.role : null)
                    };
                })
            };
        });
    };

    useEffect(() => {
        socket.on('gameStarted', ({ gameState: gs }) => {
            setGameState(gs);
            setMessage(`🎭 Votre rôle : ${ROLE_INFO[gs.myRole]?.name} ${ROLE_INFO[gs.myRole]?.emoji}`);
        });

        socket.on('phaseChanged', ({ phase: newPhase, round: newRound, endTime: et, players }) => {
            setPhase(newPhase);
            setRound(newRound);
            setCurrentAction(null);
            setSelectedTarget(null);
            setSelectedTargets([]);
            setSeerVision(null);
            setNightResults(null);
            setDayResults(null);

            if (players) updatePlayers(players);

            if (et) {
                setEndTime(et);
                setTimeLeft(Math.max(0, Math.ceil((et - Date.now()) / 1000)));
            } else {
                setEndTime(null);
            }

            if (newPhase === 'night') {
                setMessage(`🌙 Nuit ${newRound} - Tous les joueurs ferment les yeux...`);
            } else {
                setMessage(`☀️ Jour ${newRound} - Le village se réveille !`);
            }
        });

        socket.on('roleAction', ({ role, endTime: et, victimId }) => {
            const roleInfo = ROLE_INFO[role];
            if (et) {
                setEndTime(et);
                setTimeLeft(Math.max(0, Math.ceil((et - Date.now()) / 1000)));
            }

            if (myRole === role && isAlive) {
                setCurrentAction(role);

                if (role === 'cupidon') {
                    setMessage(`💘 Cupidon, désignez 2 amoureux`);
                } else if (role === 'loup-garou') {
                    setMessage(`🐺 Loups-Garous, votez pour votre victime`);
                } else if (role === 'voyante') {
                    setMessage(`🔮 Voyante, choisissez un joueur à espionner`);
                } else if (role === 'sorciere') {
                    setMessage(`🧪 Sorcière, utilisez vos potions si vous le souhaitez`);
                    setWitchOptions({ canSave: true, canKill: true });
                    // Afficher la victime provisoire si elle existe
                    if (victimId) {
                        setNightResults(prev => ({ ...prev, deaths: [victimId] }));
                    }
                }
            } else {
                setMessage(`${roleInfo.emoji} C'est le tour des ${roleInfo.name}...`);
            }
        });

        socket.on('nightResults', ({ deaths, lovers, players }) => {
            setNightResults({ deaths, lovers });
            if (players) updatePlayers(players);

            if (deaths && deaths.length > 0) {
                setMessage(`💀 ${deaths.length} personne(s) sont mortes cette nuit...`);
            } else {
                setMessage(`✨ Personne n'est mort cette nuit !`);
            }
        });

        socket.on('seerVision', ({ targetName, role }) => {
            const roleInfo = ROLE_INFO[role];
            setSeerVision({ targetName, role });
            // On ne change pas le message principal pour ne pas perturber le flow si ça enchaine vite
            // L'encart "Votre vision" suffira
        });

        socket.on('dayResults', ({ victim, loverDied, players }) => {
            setDayResults({ victim, loverDied });
            if (players) updatePlayers(players);

            if (victim) {
                const player = gameState?.players.find(p => p.id === victim);
                setMessage(`⚖️ ${player?.name} a été éliminé par le village`);
            } else {
                setMessage(`🤝 Aucun consensus, personne n'est éliminé`);
            }
        });

        socket.on('hunterTurn', ({ hunterId }) => {
            if (socket.id === hunterId) {
                setCurrentAction('chasseur');
                setMessage(`🏹 Chasseur, choisissez votre dernière cible avant de mourir !`);
            } else {
                setMessage(`🏹 Le chasseur choisit sa cible...`);
            }
        });

        socket.on('hunterKilled', ({ victim }) => {
            const player = gameState?.players.find(p => p.id === victim);
            setMessage(`🏹 Le chasseur a tué ${player?.name} !`);
        });

        socket.on('voteUpdate', ({ voteCount: count, totalVotes }) => {
            setVoteCount(count);
            setMessage(`🗳️ Votes : ${count}/${totalVotes}`);
        });

        socket.on('actionRegistered', () => {
            // On garde l'état "envoyé" mais on laisse le serveur changer la phase
            setMessage(`✓ Action envoyée... attente des autres`);
            // On désactive les actions
            setCurrentAction(null);
        });

        socket.on('voteRegistered', () => {
            setMessage(`✓ Vote enregistré... attente des autres`);
            // On peut laisser le vote actif pour changer d'avis ? 
            // Pour l'instant on désactive pour simplifier l'UI et éviter le spam
            setCurrentAction(null);
        });

        socket.on('gameOver', ({ winner, lovers, players }) => {
            setGameOver({ winner, lovers, players });
        });

        return () => {
            socket.off('gameStarted');
            socket.off('phaseChanged');
            socket.off('roleAction');
            socket.off('nightResults');
            socket.off('seerVision');
            socket.off('dayResults');
            socket.off('hunterTurn');
            socket.off('hunterKilled');
            socket.off('voteUpdate');
            socket.off('actionRegistered');
            socket.off('voteRegistered');
            socket.off('gameOver');
        };
    }, [socket, myRole, isAlive, gameState]);

    const handleSkipTurn = () => {
        socket.emit('skipTurn', { roomCode });
    };

    const handleNightAction = () => {
        if (!selectedTarget && selectedTargets.length === 0) return;

        if (myRole === 'cupidon') {
            if (selectedTargets.length !== 2) return;
            socket.emit('nightAction', {
                roomCode,
                action: { targets: selectedTargets }
            });
        } else {
            socket.emit('nightAction', {
                roomCode,
                action: { target: selectedTarget }
            });
        }
    };

    const handleWitchAction = (type, targetId = null) => {
        const action = {};

        if (type === 'save') {
            // Utiliser la victime déjà reçue
            action.saveTarget = nightResults?.deaths?.[0];
            // Si on sauve, on ne peut pas kill dans le même tour (simplification UI)
            // Mais le backend gère les deux. Pour l'instant on envoie juste ça.
        } else if (type === 'kill' && targetId) {
            action.killTarget = targetId;
        }

        socket.emit('nightAction', { roomCode, action });
    };

    const handleDayVote = (targetId) => {
        socket.emit('dayVote', { roomCode, targetId });
        setSelectedTarget(targetId);
    };

    const handleHunterKill = () => {
        if (!selectedTarget) return;
        socket.emit('hunterKill', { roomCode, targetId: selectedTarget });
    };

    const toggleTarget = (playerId) => {
        if (myRole === 'cupidon') {
            if (selectedTargets.includes(playerId)) {
                setSelectedTargets(selectedTargets.filter(id => id !== playerId));
            } else if (selectedTargets.length < 2) {
                setSelectedTargets([...selectedTargets, playerId]);
            }
        } else {
            // Sorcière : si on est en mode "tuer" (c'est-à-dire on a cliqué sur le bouton kill et on attend une cible)
            // L'interface actuelle est un peu limitée : on a "Utiliser potion mort" qui est disabled si pas de target.
            // Donc il faut pouvoir sélectonner une target AVANT de cliquer sur le bouton mort.
            // MAIS on ne veut pas sélectionner une target pour "Rien" ou "Sauver".

            // Logique unifiée :
            setSelectedTarget(playerId);
        }
    };

    if (!gameState) {
        return (
            <div className="container flex-center" style={{ minHeight: '100vh' }}>
                <div className="card">
                    <h2>Chargement de la partie...</h2>
                </div>
            </div>
        );
    }

    const alivePlayers = gameState.players.filter(p => p.alive);
    const myPlayer = gameState.players.find(p => p.id === socket.id);

    // Déterminer si on peut agir
    // Pour la sorcière, c'est spécial car elle a plusieurs boutons
    // Pour le jour, c'est si on n'a pas encore voté (mais on a mis currentAction à null après vote)
    let canAct = isAlive && (currentAction || (phase === 'day' && !dayResults));

    // Si j'ai déjà voté le jour, je ne peux plus agir (simplification)
    // Le serveur renvoie voteRegistered et on set currentAction à null
    // Mais pour le jour on n'a pas de "roleAction" explicite qui set currentAction='dayVote'
    // Donc on utilise phase === 'day'

    return (
        <div className={`game-page ${phase === 'night' ? 'night-bg' : 'day-bg'}`}>
            {gameOver && (
                <GameOverModal
                    winner={gameOver.winner}
                    players={gameOver.players}
                    lovers={gameOver.lovers}
                    onReturn={() => navigate('/')}
                />
            )}

            <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                {/* Header */}
                <div className="game-header card mb-3">
                    <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h2 style={{ marginBottom: '0.5rem' }}>
                                {phase === 'night' ? '🌙 Nuit' : '☀️ Jour'} {round}
                            </h2>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Code: {roomCode}
                            </div>
                            {endTime && (
                                <div style={{
                                    marginTop: '0.5rem',
                                    color: timeLeft < 10 ? '#ff4d4d' : 'var(--text-primary)',
                                    fontWeight: 'bold',
                                    fontSize: '1.1rem'
                                }}>
                                    ⏱️ {timeLeft}s
                                </div>
                            )}
                        </div>

                        <div className="role-display" style={{
                            padding: '1rem 2rem',
                            background: `linear-gradient(135deg, ${ROLE_INFO[myRole]?.color}20, ${ROLE_INFO[myRole]?.color}40)`,
                            borderRadius: '12px',
                            border: `2px solid ${ROLE_INFO[myRole]?.color}`,
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '2rem' }}>{ROLE_INFO[myRole]?.emoji}</div>
                            <div style={{ fontWeight: 'bold' }}>{ROLE_INFO[myRole]?.name}</div>
                            {myPotions && (
                                <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                    💚 {myPotions.life} | 💀 {myPotions.death}
                                </div>
                            )}
                        </div>

                        <div className="stats">
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Joueurs vivants
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                                {alivePlayers.length}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Message */}
                <div className="message-box card mb-3" style={{
                    textAlign: 'center',
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    padding: '1.5rem',
                    background: 'rgba(108, 99, 255, 0.1)',
                    border: '2px solid var(--accent)'
                }}>
                    {message}
                </div>

                {/* Seer Vision */}
                {seerVision && (
                    <div className="card mb-3" style={{
                        padding: '1.5rem',
                        background: 'rgba(108, 99, 255, 0.2)',
                        border: '2px solid var(--accent)',
                        textAlign: 'center'
                    }}>
                        <h3>🔮 Votre vision</h3>
                        <p style={{ fontSize: '1.2rem', marginTop: '1rem' }}>
                            <strong>{seerVision.targetName}</strong> est{' '}
                            <strong style={{ color: ROLE_INFO[seerVision.role]?.color }}>
                                {ROLE_INFO[seerVision.role]?.name} {ROLE_INFO[seerVision.role]?.emoji}
                            </strong>
                        </p>
                    </div>
                )}

                {/* Players Grid */}
                <div className="grid grid-2 mb-3">
                    {gameState.players.map((player) => {
                        const isSelected = myRole === 'cupidon'
                            ? selectedTargets.includes(player.id)
                            : selectedTarget === player.id;
                        const isLover = gameState.lovers?.includes(player.id);
                        const showRole = !player.alive || (myRole === 'loup-garou' && player.role === 'loup-garou');

                        // Déterminer si le joueur peut être cliqué
                        let clickable = false;
                        if (canAct && player.id !== socket.id && player.alive) {
                            if (currentAction === 'cupidon') {
                                clickable = true;
                            } else if (currentAction === 'loup-garou' && player.role !== 'loup-garou') {
                                clickable = true;
                            } else if (currentAction === 'voyante') {
                                clickable = true;
                            } else if (currentAction === 'sorciere') {
                                // La sorcière peut cliquer pour sa potion de mort
                                clickable = witchOptions.canKill && myPotions?.death > 0;
                            } else if (currentAction === 'chasseur') {
                                clickable = true;
                            } else if (phase === 'day' && !currentAction) {
                                // Vote de village, clickable si pas d'action en cours (donc vote pas encore fait)
                                clickable = true;
                            }
                        }

                        return (
                            <PlayerCard
                                key={player.id}
                                player={player}
                                onClick={clickable ? () => {
                                    if (currentAction === 'chasseur') {
                                        setSelectedTarget(player.id);
                                    } else if (phase === 'day' && !currentAction) {
                                        handleDayVote(player.id);
                                    } else {
                                        toggleTarget(player.id);
                                    }
                                } : null}
                                selected={isSelected}
                                isLover={isLover}
                                showRole={showRole}
                            />
                        );
                    })}
                </div>

                {/* Action Buttons */}
                {canAct && (
                    <>
                        {currentAction && (
                            <div className="card action-panel">
                                {myRole === 'cupidon' && currentAction === 'cupidon' && (
                                    <button
                                        className="btn btn-success"
                                        style={{ width: '100%' }}
                                        onClick={handleNightAction}
                                        disabled={selectedTargets.length !== 2}
                                    >
                                        💘 Désigner les amoureux ({selectedTargets.length}/2)
                                    </button>
                                )}

                                {myRole === 'loup-garou' && currentAction === 'loup-garou' && (
                                    <button
                                        className="btn btn-danger"
                                        style={{ width: '100%' }}
                                        onClick={handleNightAction}
                                        disabled={!selectedTarget}
                                    >
                                        🐺 Voter pour cette victime
                                    </button>
                                )}

                                {myRole === 'voyante' && currentAction === 'voyante' && (
                                    <button
                                        className="btn"
                                        style={{ width: '100%' }}
                                        onClick={handleNightAction}
                                        disabled={!selectedTarget}
                                    >
                                        🔮 Révéler l'identité
                                    </button>
                                )}

                                {myRole === 'sorciere' && currentAction === 'sorciere' && (
                                    <div className="flex flex-col gap-2">
                                        {witchOptions.canSave && nightResults?.deaths?.[0] && myPotions.life > 0 && (
                                            <button
                                                className="btn btn-success"
                                                style={{ width: '100%' }}
                                                onClick={() => handleWitchAction('save')}
                                            >
                                                💚 Utiliser potion VIE sur {gameState.players.find(p => p.id === nightResults.deaths[0])?.name}
                                            </button>
                                        )}

                                        {witchOptions.canKill && myPotions.death > 0 && (
                                            <button
                                                className="btn btn-danger"
                                                style={{ width: '100%' }}
                                                onClick={() => handleWitchAction('kill', selectedTarget)}
                                                disabled={!selectedTarget}
                                            >
                                                💀 Utiliser potion MORT {selectedTarget ? `sur ${gameState.players.find(p => p.id === selectedTarget)?.name}` : ''}
                                            </button>
                                        )}

                                        <button
                                            className="btn btn-secondary"
                                            style={{ width: '100%' }}
                                            onClick={() => handleWitchAction('skip')}
                                        >
                                            Ne rien faire
                                        </button>
                                    </div>
                                )}

                                {myRole === 'chasseur' && currentAction === 'chasseur' && (
                                    <button
                                        className="btn btn-danger"
                                        style={{ width: '100%' }}
                                        onClick={handleHunterKill}
                                        disabled={!selectedTarget}
                                    >
                                        🏹 Tirer sur cette cible
                                    </button>
                                )}

                                {/* Bouton pour passer le tour si non sorcière (sorcière a son propre bouton) */}
                                {myRole !== 'sorciere' && (
                                    <button
                                        className="btn btn-secondary"
                                        style={{ width: '100%', marginTop: '1rem' }}
                                        onClick={handleSkipTurn}
                                    >
                                        ⏩ Passer mon tour
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Day Phase Voting UI */}
                        {phase === 'day' && !currentAction && (
                            <div className="card" style={{ textAlign: 'center' }}>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                    Votez pour éliminer un joueur suspect
                                </p>
                                <p style={{ fontSize: '0.9rem' }}>
                                    Votes actuels : {voteCount}/{alivePlayers.length}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default GamePage;
