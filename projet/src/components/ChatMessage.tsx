import React from 'react';
import { MessageCircle, Bot } from 'lucide-react';
import { Message } from '../types/chat';
import { clsx } from 'clsx';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isBot = message.sender === 'bot';
  
  return (
    <div className={clsx(
      'flex gap-3 p-4 rounded-lg animate-fade-in',
      isBot ? 'bg-blue-50' : 'bg-gray-50'
    )}>
      <div className={clsx(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
        isBot ? 'bg-blue-500' : 'bg-gray-500'
      )}>
        {isBot ? (
          <Bot className="w-5 h-5 text-white" />
        ) : (
          <MessageCircle className="w-5 h-5 text-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 mb-1">
          {isBot ? 'Assistant' : 'Vous'}
        </p>
        <p className="text-gray-700 whitespace-pre-wrap break-words">
          {message.content}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};