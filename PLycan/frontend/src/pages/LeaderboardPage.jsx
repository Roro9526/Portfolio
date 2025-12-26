import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LeaderboardPage() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            const serverUrl = import.meta.env.VITE_SERVER_URL || `${window.location.protocol}//${window.location.hostname}:3001`;
            try {
                const res = await fetch(`${serverUrl}/leaderboard`);
                const data = await res.json();
                setUsers(data);
            } catch (error) {
                console.error('Erreur leaderboard:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    return (
        <div className="container flex-center" style={{ minHeight: '100vh' }}>
            <div className="card" style={{ maxWidth: '600px', width: '100%' }}>
                <h1 className="text-center mb-4">🏆 Classement Mondial 🏆</h1>

                {loading ? (
                    <p className="text-center">Chargement des statistiques...</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="stats-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--card-border)' }}>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>#</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Joueur</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>Points</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>Parties</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user, index) => (
                                    <tr key={user._id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                                        <td style={{ padding: '12px' }}>{index + 1}</td>
                                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{user.name}</td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <span style={{
                                                background: user.score >= 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 71, 87, 0.2)',
                                                color: user.score >= 0 ? '#4caf50' : '#ff4757',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontWeight: 'bold'
                                            }}>
                                                {user.score ?? 0} pts
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>{user.gamesPlayed ?? 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {users.length === 0 && <p className="text-center mt-3">Aucun score enregistré pour le moment.</p>}
                    </div>
                )}

                <button
                    className="btn btn-secondary mt-4"
                    style={{ width: '100%' }}
                    onClick={() => navigate('/')}
                >
                    ⬅️ Retour à l'accueil
                </button>
            </div>
        </div>
    );
}

export default LeaderboardPage;
