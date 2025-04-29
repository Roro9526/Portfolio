import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { HelpCircle, Lock, User } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, error, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Rediriger si déjà connecté
    if (user) {
      navigate('/chat');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await login(username, password);
      if (success) {
        navigate('/chat');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--login-bg-from)] to-[var(--login-bg-to)] p-4">

<div className="max-w-md w-full bg-[var(--card-bg)] rounded-xl shadow-lg overflow-hidden relative">
  <div className="absolute top-4 left-4">
    <img src="/images/LOGO_GFC.png" alt="Logo GFC" className="h-6 w-auto" />
  </div>
  <div className="bg-[var(--primary-color)] p-6 text-center">
    <h1 className="text-2xl font-bold text-[var(--title-color)]">Bob l'assistant</h1>
    <p className="text-[var(--subtitle-color)]">Connectez-vous pour accéder au support</p>
  </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start">
              <HelpCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-[var(--text-color)] mb-1">
                Nom d'utilisateur
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 block w-full rounded-md border-[var(--input-border)] shadow-sm focus:border-[var(--primary-color)] focus:ring-[var(--primary-color)] sm:text-sm h-10 border p-2 bg-[var(--input-bg)] text-[var(--text-color)]"
                  placeholder="Votre identifiant AD"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-[var(--text-color)] mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 block w-full rounded-md border-[var(--input-border)] shadow-sm focus:border-[var(--primary-color)] focus:ring-[var(--primary-color)] sm:text-sm h-10 border p-2 bg-[var(--input-bg)] text-[var(--text-color)]"
                  placeholder="Votre mot de passe"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--primary-color)] hover:bg-[var(--primary-hover-color)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-color)] ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[var(--text-color)]">
            <p>Utilisez vos identifiants du domaine France Courtage</p>
          </div>
        </div>
      </div>
    </div>
  );

};

export default LoginPage;