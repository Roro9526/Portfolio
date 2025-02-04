import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { Message } from './types/chat';
import { sendMessage } from './utils/api';
import { Bot, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';

function App() {
  const [messages, setMessages] = useState<Message[]>([{
    id: Date.now().toString(),
    content: 'Bonjour! Je suis votre assistant. Comment puis-je vous aider?',
    sender: 'bot',
    timestamp: new Date()
  }]);
  const [isLoading, setIsLoading] = useState(false);
  const [awaitingFeedback, setAwaitingFeedback] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: generateUniqueId(),
      content,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1200));

      const response = await sendMessage(content);

      const botMessage: Message = {
        id: generateUniqueId(),
        content: response,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

      // Suppression du message vide et ajout direct des boutons de feedback
      setAwaitingFeedback(true);
      setCurrentMessageId(botMessage.id); // On associe le message du bot aux boutons de feedback
    } catch (error) {
      const errorMessage: Message = {
        id: generateUniqueId(),
        content: "Une erreur s'est produite. Veuillez réessayer.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, feedback: boolean) => {
    const lastUserMessage = messages.find(message => message.id === messageId);
    if (lastUserMessage) {
      try {
        //const response = await sendMessage(feedback ? 'oui' : 'non'); // Cette logique dépend de l'API
        const botMessage: Message = {
          id: generateUniqueId(),
          content: feedback ? 'Merci pour votre retour ! Votre validation a été enregistrée.' : 'D\'accord, je vais chercher une autre solution ou reformuler la demande.',
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } catch (error) {
        const errorMessage: Message = {
          id: generateUniqueId(),
          content: "Une erreur s'est produite. Veuillez réessayer.",
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    }
  };

  const handleGlpiClick = () => {
    // Récupérer le dernier message de l'utilisateur
    const lastUserMessage = messages.filter(message => message.sender === 'user').slice(-1)[0]?.content;

    if (lastUserMessage) {
      // Encoder le contenu du message pour l'URL
      const encodedContent = encodeURIComponent(lastUserMessage);
      // Créer l'URL avec le dernier message de l'utilisateur comme contenu
      const glpiUrl = `https://glpi.francecourtage.fr/front/helpdesk.public.php?create_ticket=1`;
      window.open(glpiUrl, '_blank'); // Ouvrir dans une nouvelle fenêtre
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg flex flex-col h-[600px]">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Assistant Support Technique</h1>
              <p className="text-sm text-gray-500">Je suis là pour vous aider avec vos problèmes techniques</p>
            </div>
          </div>
          <button
            onClick={handleGlpiClick}
            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
          >
            GLPI
          </button>
        </div>

        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id}>
              <ChatMessage message={message} />
              {message.sender === 'bot' && awaitingFeedback && message.id === currentMessageId && (
                <div className="flex justify-start items-center mt-2 text-sm text-gray-500">
                  <button
                    onClick={() => handleFeedback(message.id, true)}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-green-500 hover:bg-gray-300 transition duration-200 transform hover:scale-110 mr-2"
                    aria-label="Thumbs Up"
                  >
                    <ThumbsUp className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleFeedback(message.id, false)}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-red-500 hover:bg-gray-300 transition duration-200 transform hover:scale-110"
                    aria-label="Thumbs Down"
                  >
                    <ThumbsDown className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-gray-500 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>En train d'écrire...</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}

export default App;
