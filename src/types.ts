export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string; // ISO string format
  status: 'sent' | 'delivered' | 'read';
}

export interface User {
  username: string;
  status: 'online' | 'offline';
  socketId?: string;
  lastSeen?: string;
}

export interface TypingState {
  username: string;
  isTyping: boolean;
}
