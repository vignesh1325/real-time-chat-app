import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, ArrowRight, Sparkles } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (username: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    
    if (!trimmed) {
      setError('Please enter a username to continue.');
      return;
    }
    
    if (trimmed.length < 2) {
      setError('Username must be at least 2 characters long.');
      return;
    }

    if (trimmed.length > 20) {
      setError('Username must be under 20 characters.');
      return;
    }

    // Alphanumeric + spaces + underscores only for clean usernames
    if (!/^[a-zA-Z0-9_ ]+$/.test(trimmed)) {
      setError('Usernames can only contain letters, numbers, spaces, and underscores.');
      return;
    }

    setError('');
    onLogin(trimmed);
  };

  return (
    <div
      id="login-screen-container"
      className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans relative overflow-hidden"
    >
      {/* Decorative background gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl -z-10" />

      <motion.div
        id="login-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-8 relative"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-4 shadow-sm">
            <MessageSquare className="w-8 h-8" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white tracking-tight flex items-center gap-2">
            Workspace Chat
            <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Enter a display name to join the real-time conversation pool.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2"
            >
              Choose your display name
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                autoFocus
                placeholder="Enter your username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError('');
                }}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-950 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
              />
            </div>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-rose-500 font-medium mt-2"
              >
                {error}
              </motion.p>
            )}
          </div>

          <button
            id="join-button"
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-sm shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-[0.98] cursor-pointer"
          >
            Enter Workspace
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
            Instant messaging • Persisted history
          </p>
        </div>
      </motion.div>
    </div>
  );
}
export default LoginScreen;
