import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';

const ROLE_INFO = {
    'loup-garou': { name: 'Loup-Garou', emoji: '🐺', color: '#8B0000', team: 'Loups' },
    'voyante': { name: 'Voyante', emoji: '🔮', color: '#6C63FF', team: 'Village' },
    'sorciere': { name: 'Sorcière', emoji: '🧪', color: '#228B22', team: 'Village' },
    'cupidon': { name: 'Cupidon', emoji: '💘', color: '#FF69B4', team: 'Village' },
    'chasseur': { name: 'Chasseur', emoji: '🏹', color: '#CD853F', team: 'Village' },
    'villageois': { name: 'Villageois', emoji: '👤', color: '#4169E1', team: 'Village' }
};

function LobbyPage() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { socket } = useSocket();

    // Initialiser avec gameState si passé via navigation
    const [gameState, setGameState] = useState(location.state?.gameState || null);
    const [roleConfig, setRoleConfig] = useState(
        location.state?.gameState?.roleConfig || {
            'loup-garou': 2,
            'voyante': 1,
            'sorciere': 1,
            'cupidon': 0,
            'chasseur': 0,
            'villageois': 3
        }
    );
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        console.log('LobbyPage mounted, gameState:', gameState);
        console.log('location.state:', location.state);

        // Écouter l'événement playerJoined pour l'état initial
        socket.on('joinedGame', ({ gameState: gs }) => {
            console.log('Received joinedGame:', gs);
            setGameState(gs);
            if (gs.roleConfig) setRoleConfig(gs.roleConfig);
        });

        socket.on('playerJoined', ({ gameState: gs }) => {
            console.log('Received playerJoined:', gs);
            setGameState(gs);
        });

        socket.on('playerLeft', ({ gameState: gs }) => {
            console.log('Received playerLeft:', gs);
            setGameState(gs);
        });

        socket.on('newHost', ({ newHostId, gameState: gs }) => {
            console.log('Received newHost:', newHostId, gs);
            setGameState({ ...gs, hostId: newHostId });
        });

        socket.on('rolesUpdated', ({ roleConfig: newConfig }) => {
            console.log('Received rolesUpdated:', newConfig);
            setRoleConfig(newConfig);
        });

        socket.on('gameStarted', ({ gameState: gs }) => {
            console.log('Received gameStarted:', gs);
            navigate(`/game/${roomCode}`, { state: { gameState: gs } });
        });

        socket.on('gameDeleted', () => {
            alert('La partie a été supprimée');
            navigate('/');
        });

        return () => {
            socket.off('joinedGame');
            socket.off('playerJoined');
            socket.off('playerLeft');
            socket.off('newHost');
            socket.off('rolesUpdated');
            socket.off('gameStarted');
            socket.off('gameDeleted');
        };
    }, [socket, navigate, roomCode, location.state]);

    const updateRole = (roleId, delta) => {
        const newConfig = { ...roleConfig };
        newConfig[roleId] = Math.max(0, Math.min(10, newConfig[roleId] + delta));
        setRoleConfig(newConfig);
        socket.emit('updateRoles', { roomCode, roleConfig: newConfig });
    };

    const handleStartGame = () => {
        socket.emit('startGame', { roomCode });
    };

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!gameState) {
        return (
            <div className="container flex-center" style={{ minHeight: '100vh' }}>
                <div className="card">
                    <h2>Chargement...</h2>
                </div>
            </div>
        );
    }

    const isHost = socket.id === gameState.hostId;
    const totalRoles = Object.values(roleConfig).reduce((a, b) => a + b, 0);
    const playerCount = gameState.playerCount;
    const canStart = totalRoles === playerCount && playerCount >= 4;

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
            <div className="card mb-3">
                <h1 className="text-center mb-2">🐺 Salle d'attente</h1>

                <div className="flex-center mb-3" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem 2rem',
                        background: 'rgba(108, 99, 255, 0.2)',
                        borderRadius: '12px',
                        border: '2px solid var(--accent)'
                    }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '4px' }}>
                            {roomCode}
                        </span>
                        <button
                            className="btn btn-secondary"
                            onClick={copyRoomCode}
                            style={{ padding: '0.5rem 1rem' }}
                        >
                            {copied ? '✓ Copié' : '📋 Copier'}
                        </button>
                    </div>
                </div>

                <p className="text-center text-secondary">
                    Partagez ce code avec vos amis pour qu'ils rejoignent la partie
                </p>
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                {/* Liste des joueurs */}
                <div className="card">
                    <h2 className="mb-3">👥 Joueurs ({playerCount})</h2>
                    <div className="flex flex-col gap-2">
                        {gameState.players.map((player) => (
                            <div
                                key={player.id}
                                style={{
                                    padding: '1rem',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <span>{player.name}</span>
                                {player.isHost && (
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        background: 'var(--gold)',
                                        color: '#000',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold'
                                    }}>
                                        👑 HÔTE
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Configuration des rôles */}
                <div className="card">
                    <h2 className="mb-3">🎭 Configuration des rôles</h2>

                    {!isHost && (
                        <p className="text-secondary mb-3" style={{ fontSize: '0.9rem' }}>
                            Seul l'hôte peut modifier les rôles
                        </p>
                    )}

                    <div className="flex flex-col gap-2 mb-3">
                        {Object.entries(ROLE_INFO).map(([roleId, info]) => (
                            <div
                                key={roleId}
                                style={{
                                    padding: '1rem',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderLeft: `4px solid ${info.color}`
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>
                                        {info.emoji} {info.name}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        {info.team}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {isHost ? (
                                        <>
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => updateRole(roleId, -1)}
                                                disabled={roleConfig[roleId] === 0}
                                                style={{ padding: '0.5rem 1rem', minWidth: '40px' }}
                                            >
                                                −
                                            </button>
                                            <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 'bold' }}>
                                                {roleConfig[roleId]}
                                            </span>
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => updateRole(roleId, 1)}
                                                disabled={roleConfig[roleId] >= 10}
                                                style={{ padding: '0.5rem 1rem', minWidth: '40px' }}
                                            >
                                                +
                                            </button>
                                        </>
                                    ) : (
                                        <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                                            {roleConfig[roleId]}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{
                        padding: '1rem',
                        background: totalRoles === playerCount
                            ? 'rgba(46, 213, 115, 0.1)'
                            : 'rgba(255, 71, 87, 0.1)',
                        border: `1px solid ${totalRoles === playerCount ? 'var(--success)' : 'var(--danger)'}`,
                        borderRadius: '8px',
                        marginBottom: '1rem'
                    }}>
                        <strong>Total rôles:</strong> {totalRoles} / {playerCount} joueurs
                    </div>

                    {isHost && (
                        <>
                            {!canStart && (
                                <p style={{
                                    color: 'var(--danger)',
                                    fontSize: '0.9rem',
                                    marginBottom: '1rem'
                                }}>
                                    {playerCount < 4
                                        ? '⚠️ Minimum 4 joueurs requis'
                                        : '⚠️ Le nombre de rôles doit correspondre au nombre de joueurs'}
                                </p>
                            )}

                            <button
                                className="btn btn-success"
                                style={{ width: '100%' }}
                                onClick={handleStartGame}
                                disabled={!canStart}
                            >
                                🚀 Démarrer la partie
                            </button>
                        </>
                    )}

                    {!isHost && (
                        <p className="text-center text-secondary" style={{ fontSize: '0.9rem' }}>
                            En attente que l'hôte lance la partie...
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default LobbyPage;
