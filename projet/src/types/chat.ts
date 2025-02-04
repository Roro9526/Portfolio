export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  requestId?: number;
  isSolutionQuery?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}