import React from 'react';
import { User } from '../types.js';
import { UserAvatar } from './UserAvatar.js';
import { LogOut, Hash, Users, Circle, MessageSquare } from 'lucide-react';

interface SidebarProps {
  currentUser: string;
  users: User[];
  onLogout: () => void;
}

export function Sidebar({ currentUser, users, onLogout }: SidebarProps) {
  // Sort users so online users are at the top, then alphabetically, and exclude current user from general list (or show with a "you" label)
  const sortedUsers = [...users]
    .filter((u) => u && typeof u.username === 'string')
    .sort((a, b) => {
      if (a.status === 'online' && b.status !== 'online') return -1;
      if (a.status !== 'online' && b.status === 'online') return 1;
      return (a.username || '').localeCompare(b.username || '');
    });

  const onlineCount = users.filter((u) => u.status === 'online').length;

  return (
    <aside
      id="sidebar-container"
      className="w-full md:w-80 border-r border-slate-100 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-900 flex flex-col h-full shrink-0 select-none"
    >
      {/* Workspace Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-indigo-600/10">
            WS
          </div>
          <div>
            <h2 className="font-bold text-slate-800 dark:text-white tracking-tight text-base leading-tight">
              Workspace
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              Live Sync Engine
            </p>
          </div>
        </div>
      </div>

      {/* Main Sections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Channel Selection */}
        <div>
          <span className="px-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
            Active Channel
          </span>
          <div className="space-y-1">
            <button
              id="channel-general"
              className="w-full flex items-center justify-between px-3 py-3 bg-white dark:bg-slate-800 border-l-4 border-indigo-600 text-slate-800 dark:text-white font-bold text-sm shadow-sm transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-indigo-600" />
                <span>general</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>
          </div>
        </div>

        {/* Directory / Users List */}
        <div>
          <div className="px-2 flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
              Workspace Users ({users.length})
            </span>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{onlineCount} online</span>
            </div>
          </div>

          <div className="space-y-1">
            {sortedUsers.map((user) => {
              const isMe = user.username === currentUser;
              const isOnline = user.status === 'online';

              return (
                <div
                  key={user.username}
                  id={`sidebar-user-${user.username}`}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-xs ${
                    isMe
                      ? 'bg-indigo-50/50 dark:bg-slate-800/40 border border-indigo-100/40 dark:border-slate-800'
                      : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <UserAvatar
                      username={user.username}
                      size="sm"
                      showStatus
                      isOnline={isOnline}
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-700 dark:text-slate-300 truncate leading-none">
                        {user.username}
                        {isMe && (
                          <span className="ml-1.5 text-[9px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase">
                            (you)
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1 truncate leading-none">
                        {isOnline ? 'Active now' : 'Offline'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* User profile bottom rail */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-[#f1f5f9]/60 dark:bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar username={currentUser} size="sm" showStatus isOnline />
          <div className="min-w-0">
            <p className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate leading-none">
              {currentUser}
            </p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1.5 leading-none flex items-center gap-1.5 uppercase tracking-wider">
              <Circle className="w-1.5 h-1.5 fill-emerald-500 text-emerald-500" />
              Connected
            </p>
          </div>
        </div>
        <button
          id="logout-button"
          onClick={onLogout}
          title="Leave Workspace"
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border border-slate-200/40 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
export default Sidebar;
