import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types.js';
import { UserAvatar } from './UserAvatar.js';
import { Send, Hash, Users, Sparkles, Check, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatAreaProps {
  currentUser: string;
  messages: Message[];
  typingUsers: string[];
  onlineCount: number;
  onSendMessage: (text: string) => void;
  onTyping: (isTyping: boolean) => void;
  onMarkRead: () => void;
}

export function ChatArea({
  currentUser,
  messages,
  typingUsers,
  onlineCount,
  onSendMessage,
  onTyping,
  onMarkRead,
}: ChatAreaProps) {
  const [inputText, setInputText] = useState('');
  const [isTypingState, setIsTypingState] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    // Mark messages as read whenever we receive new messages and the chat is active
    onMarkRead();
  }, [messages]);

  // Handle keypress typing indicator triggers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (!isTypingState && val.trim().length > 0) {
      setIsTypingState(true);
      onTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingState(false);
      onTyping(false);
    }, 1500);
  };

  // Handle message submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    onSendMessage(trimmed);
    setInputText('');

    // Clear typing status instantly on submit
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTypingState(false);
    onTyping(false);
  };

  // Focus input on mount
  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    inputRef.current?.focus();
    onMarkRead();
  }, []);

  // Helper to format ISO timestamp to human-readable short time (e.g. 10:45 AM)
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // Helper to format Date header
  const formatDateHeader = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      if (d.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (d.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
      }
    } catch (e) {
      return '';
    }
  };

  // Group messages by day
  const groupedMessages: { date: string; list: Message[] }[] = [];
  messages.forEach((msg) => {
    const dateStr = new Date(msg.timestamp).toDateString();
    const existing = groupedMessages.find((g) => g.date === dateStr);
    if (existing) {
      existing.list.push(msg);
    } else {
      groupedMessages.push({ date: dateStr, list: [msg] });
    }
  });

  return (
    <div id="chat-area" className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950 min-w-0">
      {/* Chat Header */}
      <div className="h-16 px-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between select-none shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-950 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-extrabold text-sm">
            #
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">general</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
          <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
            {onlineCount} {onlineCount === 1 ? 'user' : 'users'}
          </span>
        </div>
      </div>

      {/* Message List */}
      <div
        ref={scrollContainerRef}
        id="messages-scroll-container"
        className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-white dark:bg-slate-950"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none">
            <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm max-w-sm">
              <Sparkles className="w-8 h-8 text-indigo-500 mx-auto mb-3 animate-pulse" />
              <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">Welcome to General Room</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed">
                Say hello to your teammate! Messages sent here will sync across all open tabs in real-time.
              </p>
            </div>
          </div>
        ) : (
          groupedMessages.map((group, groupIdx) => (
            <div key={group.date} className="space-y-6">
              {/* Date Separator */}
              <div className="flex items-center justify-center my-4 select-none">
                <div className="border-t border-slate-100 dark:border-slate-800 flex-1" />
                <span className="mx-4 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 tracking-widest bg-white dark:bg-slate-950 px-3 uppercase">
                  {formatDateHeader(group.list[0].timestamp)}
                </span>
                <div className="border-t border-slate-100 dark:border-slate-800 flex-1" />
              </div>

              {group.list.map((msg) => {
                const isMe = msg.sender === currentUser;
                return (
                  <motion.div
                    key={msg.id}
                    id={`message-${msg.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-3 max-w-[85%] sm:max-w-[70%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                    {/* Avatar for other users */}
                    {!isMe && (
                      <div className="shrink-0 mt-1">
                        <UserAvatar username={msg.sender} size="sm" />
                      </div>
                    )}

                    <div className="flex flex-col">
                      {/* Name header for other users */}
                      {!isMe && (
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-300 mb-1 ml-1 select-none">
                          {msg.sender}
                        </span>
                      )}

                      {/* Message Bubble */}
                      <div
                        className={`p-3.5 text-sm break-words leading-relaxed shadow-sm ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-tl-xl rounded-bl-xl rounded-br-xl'
                            : 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-tr-xl rounded-br-xl rounded-bl-xl border border-slate-200/50 dark:border-slate-800'
                        }`}
                      >
                        {msg.text}
                        
                        {/* Timestamp & Status inside bubble */}
                        <div
                          className={`flex items-center justify-end gap-1 text-[9px] mt-1.5 select-none leading-none ${
                            isMe ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          <span>{formatTime(msg.timestamp)}</span>
                          {isMe && (
                            <span className="inline-flex">
                              {msg.status === 'read' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-indigo-100" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-indigo-300" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator Bar */}
      <div id="typing-indicator-bar" className="px-6 min-h-6 flex items-center shrink-0 bg-white dark:bg-slate-950 select-none pb-2">
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-medium"
            >
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="italic">
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Tray */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 max-w-7xl mx-auto">
          <input
            ref={inputRef}
            id="message-input"
            type="text"
            placeholder="Type your message..."
            value={inputText}
            onChange={handleInputChange}
            className="flex-1 bg-transparent border-none text-sm focus:outline-none focus:ring-0 placeholder-slate-400 text-slate-800 dark:text-white px-2"
          />
          <button
            id="message-send-button"
            type="submit"
            disabled={!inputText.trim()}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider shadow-md hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
export default ChatArea;
