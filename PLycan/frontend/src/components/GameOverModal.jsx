import './GameOverModal.css';

const TEAM_NAMES = {
    'village': 'Village',
    'loups': 'Loups-Garous',
    'amoureux': 'Amoureux'
};

const TEAM_EMOJIS = {
    'village': '🏘️',
    'loups': '🐺',
    'amoureux': '💕'
};

const ROLE_INFO = {
    'loup-garou': { name: 'Loup-Garou', emoji: '🐺' },
    'voyante': { name: 'Voyante', emoji: '🔮' },
    'sorciere': { name: 'Sorcière', emoji: '🧪' },
    'cupidon': { name: 'Cupidon', emoji: '💘' },
    'chasseur': { name: 'Chasseur', emoji: '🏹' },
    'villageois': { name: 'Villageois', emoji: '👤' }
};

function GameOverModal({ winner, players, lovers, onReturn }) {
    return (
        <div className="modal-overlay">
            <div className="modal-content card">
                <h1 className="text-center mb-4">
                    {TEAM_EMOJIS[winner]} Victoire des {TEAM_NAMES[winner]} ! {TEAM_EMOJIS[winner]}
                </h1>

                {winner === 'amoureux' && lovers && (
                    <div className="lovers-victory mb-4">
                        <p className="text-center" style={{ fontSize: '1.2rem' }}>
                            💘 Les amoureux ont survécu ! 💘
                        </p>
                    </div>
                )}

                <div className="players-reveal mb-4">
                    <h3 className="mb-3">🎭 Révélation des rôles</h3>
                    <div className="grid grid-2">
                        {players.map((player) => {
                            const roleInfo = ROLE_INFO[player.role];
                            return (
                                <div
                                    key={player.id}
                                    className="player-reveal-card"
                                    style={{
                                        background: player.alive
                                            ? 'rgba(46, 213, 115, 0.1)'
                                            : 'rgba(255, 71, 87, 0.1)',
                                        borderLeft: player.alive
                                            ? '4px solid var(--success)'
                                            : '4px solid var(--danger)'
                                    }}
                                >
                                    <div style={{ fontSize: '2rem' }}>{roleInfo.emoji}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                        <div style={{ fontWeight: 'bold' }}>{player.name}</div>
                                        <div style={{
                                            background: player.gain >= 0 ? 'rgba(46, 213, 115, 0.2)' : 'rgba(255, 71, 87, 0.2)',
                                            color: player.gain >= 0 ? 'var(--success)' : 'var(--danger)',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold'
                                        }}>
                                            {player.gain >= 0 ? '+' : ''}{player.gain} pts
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        {roleInfo.name}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                        {player.alive ? '✓ Vivant' : '💀 Mort'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <button
                    className="btn btn-success"
                    style={{ width: '100%' }}
                    onClick={onReturn}
                >
                    🏠 Retour à l'accueil
                </button>
            </div>
        </div>
    );
}

export default GameOverModal;
