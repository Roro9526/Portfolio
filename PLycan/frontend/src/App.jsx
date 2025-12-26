import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import LeaderboardPage from './pages/LeaderboardPage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/lobby/:roomCode" element={<LobbyPage />} />
                <Route path="/game/:roomCode" element={<GamePage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
