import './PlayerCard.css';

const ROLE_INFO = {
    'loup-garou': { name: 'Loup-Garou', emoji: '🐺', color: '#8B0000' },
    'voyante': { name: 'Voyante', emoji: '🔮', color: '#6C63FF' },
    'sorciere': { name: 'Sorcière', emoji: '🧪', color: '#228B22' },
    'cupidon': { name: 'Cupidon', emoji: '💘', color: '#FF69B4' },
    'chasseur': { name: 'Chasseur', emoji: '🏹', color: '#CD853F' },
    'villageois': { name: 'Villageois', emoji: '👤', color: '#4169E1' }
};

function PlayerCard({ player, onClick, selected, isLover, showRole }) {
    const roleInfo = player.role ? ROLE_INFO[player.role] : null;

    return (
        <div
            className={`player-card ${!player.alive ? 'dead' : ''} ${selected ? 'selected' : ''} ${onClick ? 'clickable' : ''}`}
            onClick={player.alive && onClick ? onClick : undefined}
            style={{
                borderColor: roleInfo?.color,
                opacity: player.alive ? 1 : 0.5
            }}
        >
            {isLover && (
                <div className="lover-badge">💖</div>
            )}

            <div className="player-avatar">
                {roleInfo && showRole ? roleInfo.emoji : '👤'}
            </div>

            <div className="player-name">
                {player.name}
            </div>

            {showRole && roleInfo && (
                <div className="player-role" style={{ color: roleInfo.color }}>
                    {roleInfo.name}
                </div>
            )}

            {!player.alive && (
                <div className="dead-overlay">
                    <div className="skull-icon">💀</div>
                    <div className="dead-text">MORT</div>
                </div>
            )}

            {selected && (
                <div className="selected-indicator">
                    ✓
                </div>
            )}
        </div>
    );
}

export default PlayerCard;
