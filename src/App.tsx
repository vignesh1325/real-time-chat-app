import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message, User } from './types.js';
import { LoginScreen } from './components/LoginScreen.js';
import { Sidebar } from './components/Sidebar.js';
import { ChatArea } from './components/ChatArea.js';
import { WifiOff, Wifi, AlertTriangle } from 'lucide-react';

export default function App() {
  const [username, setUsername] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // Load existing username from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('chat_username');
    if (saved) {
      const trimmed = saved.trim();
      setUsername(trimmed);
      initializeSession(trimmed);
    }
  }, []);

  const initializeSession = async (user: string) => {
    // 1. Fetch initial historical messages and user directories
    await fetchHistory();
    await fetchUsers();

    // 2. Establish connection
    connectSocket(user);
  };

  const connectSocket = (user: string) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Connect to the same origin where this app is served
    const socket = io({
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      // Join general channel room
      socket.emit('join', { username: user });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setIsConnected(false);
      setError('Connection interrupted. Retrying live sync...');
    });

    // Handle user list presence updates
    socket.on('users_update', (updatedUsers: User[]) => {
      setUsers(updatedUsers);
    });

    // Handle new message arrival
    socket.on('new_message', (msg: Message) => {
      setMessages((prev) => {
        // Guard to prevent duplicates
        if (prev.some((m) => m.id === msg.id)) {
          // If message is in list but status is different, update status
          return prev.map((m) => (m.id === msg.id ? msg : m));
        }
        return [...prev, msg];
      });
    });

    // Handle messages read sync
    socket.on('messages_read', (data: { updatedIds: string[] }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          data.updatedIds.includes(msg.id) ? { ...msg, status: 'read' } : msg
        )
      );
    });

    // Handle typing status updates
    socket.on('user_typing', (data: { username: string; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        if (data.isTyping) {
          if (prev.includes(data.username)) return prev;
          return [...prev, data.username];
        } else {
          return prev.filter((name) => name !== data.username);
        }
      });
    });
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/messages');
      if (!res.ok) throw new Error('Failed to load chat history');
      const data = await res.json();
      setMessages(data);
    } catch (err: any) {
      console.error('REST API error:', err);
      setError('Database sync failure. Displaying local memory instead.');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch active users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users list:', err);
    }
  };

  const handleLogin = (selectedUsername: string) => {
    localStorage.setItem('chat_username', selectedUsername);
    setUsername(selectedUsername);
    initializeSession(selectedUsername);
  };

  const handleLogout = () => {
    localStorage.removeItem('chat_username');
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setUsername(null);
    setMessages([]);
    setUsers([]);
    setIsConnected(false);
    setError(null);
  };

  const handleSendMessage = async (text: string) => {
    if (!username) return;

    // Generate simple UUID fallback for complete standalone reliability
    const messageId =
      window.crypto?.randomUUID?.() ||
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const newMessage: Message = {
      id: messageId,
      sender: username,
      text,
      timestamp: new Date().toISOString(),
      status: 'sent',
    };

    // Optimistic Update for immediate fluid feel
    setMessages((prev) => {
      if (prev.some((m) => m.id === newMessage.id)) return prev;
      return [...prev, newMessage];
    });

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMessage),
      });

      if (!res.ok) {
        throw new Error('Server rejected message');
      }
    } catch (err) {
      console.error('REST POST error:', err);
      setError('Message dispatch failed. Re-attempting sync...');
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (username && socketRef.current) {
      socketRef.current.emit('typing', { username, isTyping });
    }
  };

  const handleMarkRead = () => {
    if (username && socketRef.current) {
      socketRef.current.emit('mark_read', { exceptSender: username });
    }
  };

  // Clean up socket on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  if (!username) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div
      id="app-root-container"
      className="h-screen w-screen bg-[#f0f2f5] dark:bg-slate-950 p-0 sm:p-6 flex items-center justify-center font-sans overflow-hidden"
    >
      {/* App Container with Geometric Shadow and Alignment */}
      <div className="flex flex-col md:flex-row w-full h-full bg-white dark:bg-slate-900 shadow-2xl rounded-none sm:rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800/80 relative">
        {/* Offline Alert Bar */}
        {!isConnected && (
          <div
            id="offline-banner"
            className="bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-xs font-semibold md:absolute md:top-4 md:right-4 md:rounded-xl md:shadow-lg md:z-50 transition-all"
          >
            <WifiOff className="w-4 h-4 animate-pulse" />
            <span>Live connection lost. Re-establishing...</span>
          </div>
        )}

        {/* Global Error toast */}
        {error && (
          <div
            id="global-error-banner"
            className="bg-rose-600 text-white px-4 py-2 flex items-center justify-center gap-2 text-xs font-semibold md:absolute md:top-16 md:right-4 md:rounded-xl md:shadow-lg md:z-50 transition-all"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Sidebar - Presence List & Profile Controls */}
        <Sidebar currentUser={username} users={users} onLogout={handleLogout} />

        {/* Chat workspace view */}
        <ChatArea
          currentUser={username}
          messages={messages}
          typingUsers={typingUsers.filter((name) => name !== username)}
          onlineCount={users.filter((u) => u.status === 'online').length}
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          onMarkRead={handleMarkRead}
        />
      </div>
    </div>
  );
}
