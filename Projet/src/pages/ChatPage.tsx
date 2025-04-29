import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Send, ThumbsUp, ThumbsDown, LogOut,BarChart, HelpCircle, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// import remarkGfm from 'remark-gfm';
//import LogoGFC from '/project Sos/public/images/LOGO_GFC';


interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  showFeedback?: boolean;
}

const API_BASE_URL = import.meta.env.DEV ? 'https://sos.francecourtage.fr' : '';
if (!axios.defaults.baseURL) {
  axios.defaults.baseURL = API_BASE_URL;
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 0,
          text: `Bonjour ${user?.username || 'utilisateur'}, je suis Bob, votre assistant technique. Comment puis-je vous aider aujourd'hui ?`,
          sender: 'bot',
          timestamp: new Date(),
          showFeedback: false
        }
      ]);
    }
  }, [user, messages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setInput('');
    
    const newUserMessage: Message = {
      id: messages.length + 1,
      text: userMessage,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);
    
    try {
      console.log('ID User',user?.iduser);
      const response = await axios.post('/api/chat', { message: userMessage, iduser: user?.iduser });
      
      const botResponse: Message = {
        id: messages.length + 2,
        text: response.data.response,
        sender: 'bot',
        timestamp: new Date(),
        showFeedback: true
      };
      
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error fetching response:', error);
      
      const errorMessage: Message = {
        id: messages.length + 2,
        text: "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer.",
        sender: 'bot',
        timestamp: new Date(),
        showFeedback: false
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (isPositive: boolean, messageIndex: number) => {
    const feedbackMessage = isPositive ? 'oui' : 'non';
    
    try {
      const response = await axios.post('/api/chat', { message: feedbackMessage ,iduser: user?.iduser });
      
      setMessages(prev => 
        prev.map((msg, idx) => 
          idx === messageIndex ? { ...msg, showFeedback: false } : msg
        )
      );
      
      const feedbackResponse: Message = {
        id: messages.length + 1,
        text: response.data.response,
        sender: 'bot',
        timestamp: new Date(),
        showFeedback: false
      };
      
      setMessages(prev => [...prev, feedbackResponse]);
    } catch (error) {
      console.error('Error sending feedback:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleGLPIClick = () => {
    window.open('https://glpi.francecourtage.fr/front/helpdesk.public.php?create_ticket=1', '_blank');
  };


  const handleStatsClick = () => {
    navigate('/stats');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
//             <img src="../images/LOGO_GFC.png" className="h-11 w-14" />
//<img src={LogoGFC} alt="Logo GFC" className="h-8 w-auto" />


return (
    <div className="flex flex-col h-screen bg-[var(--bg-color)] text-[var(--text-color)]">
      <header className="bg-[var(--primary-color)] text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
          <img src="/images/LOGO_GFC.png" alt="Logo GFC" className="h-10 w-auto" />




            <div>
            <h1 className="text-xl font-bold text-[var(--title-color)]">Bob l'assistant</h1>
            <p className="text-sm text-[var(--subtitle-color)]">Support technique</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">

        <span className="text-white font-medium">
        {user?.username}
        </span>
     <button
    onClick={() => navigate('/history')}
    className="bg-[var(--glpi-color)] hover:bg-[var(--glpi-hover-color)] text-white px-3 py-2 rounded-md flex items-center text-sm"
  >
    Historique
     </button>
            <button 
              onClick={handleGLPIClick}
              className="bg-[var(--glpi-color)] hover:bg-[var(--glpi-hover-color)] text-white px-3 py-2 rounded-md flex items-center text-sm"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              <span>GLPI</span>
            </button>

            {user?.groups?.includes('admin') && (
              <button
                onClick={handleStatsClick}
                className="bg-[var(--glpi-color)] hover:bg-[var(--glpi-hover-color)] text-white px-3 py-2 rounded-md flex items-center text-sm"
              >
                <BarChart className="h-4 w-4 mr-2" />
                Statistiques
              </button>
            )}


            <button 
              onClick={handleLogout}
              className="bg-[var(--logout-color)] hover:bg-[var(--logout-hover-color)] text-white px-3 py-2 rounded-md flex items-center text-sm"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Déconnexion</span>
            </button>
            
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 container mx-auto max-w-4xl">
        <div className="space-y-4 pb-4">
          {messages.map((message, index) => (
            <div 
              key={message.id} 
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] md:max-w-[70%] rounded-lg p-4 shadow-sm ${
                  message.sender === 'user' 
                    ? 'bg-[var(--primary-color)] text-white rounded-br-none' 
                    : 'bg-[var(--message-bg)] text-[var(--text-color)] rounded-bl-none border border-[var(--border-color)]'
                }`}
              >
                <div className="prose prose-sm max-w-none whitespace-pre-wrap break-words">
                  <ReactMarkdown>{message.text}</ReactMarkdown>
                </div>
                <div className="mt-2 text-xs opacity-70 flex justify-between items-center">
                  <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  
                  {message.showFeedback && (
                    <div className="flex space-x-2 ml-4">
                      <button 
                        onClick={() => handleFeedback(true, index)}
                        className="p-1 hover:bg-blue-100 hover:text-blue-600 rounded-full transition-colors"
                        title="Cette réponse m'a aidé"
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleFeedback(false, index)}
                        className="p-1 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors"
                        title="Cette réponse ne m'a pas aidé"
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[var(--bg-color)] text-[var(--text-color)] rounded-lg rounded-bl-none p-4 shadow-sm max-w-[80%] md:max-w-[70%]">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-[var(--primary-color)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-[var(--primary-color)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-[var(--primary-color)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-[var(--border-color)] bg-[var(--bg-color)] p-4">
        <div className="container mx-auto max-w-4xl">
          <form onSubmit={handleSubmit} className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question ici..."
                className="w-full border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-color)] rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent resize-none"
                rows={1}
                style={{ minHeight: '60px', maxHeight: '150px' }}
              />
              <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                Appuyez sur Entrée pour envoyer
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={`bg-[var(--primary-color)] hover:bg-blue-300 text-white rounded-full p-3 ${
                isLoading || !input.trim() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
          
          <div className="mt-2 text-xs text-gray-500 flex items-center">
            <HelpCircle className="h-3 w-3 mr-1" />
            <span>Vos retours aident à améliorer le service d'assistance.</span>
          </div>
        </div>
      </div>
    </div>
  );

};

export default ChatPage;
