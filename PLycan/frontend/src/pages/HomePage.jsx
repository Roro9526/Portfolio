import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';

function HomePage() {
    const [playerName, setPlayerName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const { socket, isConnected } = useSocket();
    const navigate = useNavigate();

    const handleCreateGame = () => {
        if (!playerName.trim()) return;

        setIsCreating(true);

        socket.emit('createGame', { playerName });

        socket.once('gameCreated', ({ roomCode, gameState }) => {
            navigate(`/lobby/${roomCode}`, { state: { gameState } });
        });

        socket.once('error', (error) => {
            alert(error.message);
            setIsCreating(false);
        });
    };

    const handleJoinGame = () => {
        if (!playerName.trim() || !roomCode.trim()) return;

        socket.emit('joinGame', { roomCode: roomCode.toUpperCase(), playerName });

        socket.once('joinedGame', ({ gameState }) => {
            navigate(`/lobby/${roomCode.toUpperCase()}`, { state: { gameState } });
        });

        socket.once('error', (error) => {
            alert(error.message);
        });
    };

    return (
        <div className="container flex-center" style={{ minHeight: '100vh' }}>
            <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
                <h1 className="text-center mb-4">🐺 Loup-Garou</h1>
                <p className="text-center text-secondary mb-4">
                    Jeu multijoueur en ligne - Découvrez qui sont les loups-garous parmi vous !
                </p>

                {!isConnected && (
                    <div className="mb-3" style={{
                        padding: '1rem',
                        background: 'rgba(255, 71, 87, 0.1)',
                        border: '1px solid rgba(255, 71, 87, 0.3)',
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        ⚠️ Connexion au serveur...
                    </div>
                )}

                <div className="mb-3">
                    <label htmlFor="playerName" style={{ display: 'block', marginBottom: '0.5rem' }}>
                        Votre nom
                    </label>
                    <input
                        id="playerName"
                        type="text"
                        className="input"
                        placeholder="Entrez votre nom"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        maxLength={20}
                    />
                </div>

                <button
                    className="btn btn-success mb-3"
                    style={{ width: '100%' }}
                    onClick={handleCreateGame}
                    disabled={!playerName.trim() || !isConnected || isCreating}
                >
                    {isCreating ? '⏳ Création...' : '✨ Créer une partie'}
                </button>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    margin: '2rem 0',
                    gap: '1rem'
                }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }}></div>
                    <span style={{ color: 'var(--text-secondary)' }}>OU</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }}></div>
                </div>

                <div className="mb-3">
                    <label htmlFor="roomCode" style={{ display: 'block', marginBottom: '0.5rem' }}>
                        Code de la partie
                    </label>
                    <input
                        id="roomCode"
                        type="text"
                        className="input"
                        placeholder="Ex: ABC123"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        maxLength={6}
                        style={{ textTransform: 'uppercase', letterSpacing: '2px', textAlign: 'center' }}
                    />
                </div>

                <button
                    className="btn"
                    style={{ width: '100%' }}
                    onClick={handleJoinGame}
                    disabled={!playerName.trim() || !roomCode.trim() || !isConnected}
                >
                    🚪 Rejoindre une partie
                </button>

                <button
                    className="btn"
                    style={{ width: '100%', marginTop: '1rem', backgroundColor: '#ffd700', color: '#000' }}
                    onClick={() => navigate('/leaderboard')}
                >
                    🏆 Voir le Classement
                </button>

                <div className="mt-4" style={{
                    padding: '1rem',
                    background: 'rgba(108, 99, 255, 0.1)',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)'
                }}>
                    <strong>ℹ️ Comment jouer :</strong>
                    <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                        <li>Créez une partie et partagez le code</li>
                        <li>Minimum 4 joueurs requis</li>
                        <li>L'hôte configure les rôles et lance la partie</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default HomePage;
