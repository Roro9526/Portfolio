import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import ProtectedRoute from './components/ProtectedRoute';
import StatsPage from './pages/StatsPage';
import HistoryPage from './pages/HistoryPage';
import HistoryPageAdmin from './pages/HistoryPageAdmin'; 



const App = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <AuthProvider>
      <Router>
        <div>
          <button
            onClick={toggleTheme}
            className="fixed top-4 right-4 bg-[var(--primary-color)] text-white p-2 rounded-full"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route 
              path="/stats" 
              element={
                <ProtectedRoute>
                  <StatsPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="/histadmin" element={<ProtectedRoute><HistoryPageAdmin /></ProtectedRoute>} />

          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;