import React from 'react';

interface UserAvatarProps {
  username: string;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  isOnline?: boolean;
}

export function UserAvatar({
  username,
  size = 'md',
  showStatus = false,
  isOnline = false,
}: UserAvatarProps) {
  // Deterministic color generation based on username
  const colors = [
    'bg-red-500 text-white',
    'bg-orange-500 text-white',
    'bg-amber-500 text-black',
    'bg-emerald-500 text-white',
    'bg-teal-500 text-white',
    'bg-sky-500 text-white',
    'bg-indigo-500 text-white',
    'bg-violet-500 text-white',
    'bg-fuchsia-500 text-white',
    'bg-pink-500 text-white',
    'bg-rose-500 text-white',
  ];

  const getHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const colorClass = colors[getHash(username) % colors.length];

  const initials = username
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-14 h-14 text-lg font-bold',
  };

  const statusSizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div id={`avatar-${username}`} className="relative inline-block select-none">
      <div
        className={`flex items-center justify-center rounded-xl ${colorClass} ${sizeClasses[size]} shadow-sm border border-black/5`}
      >
        {initials || '?'}
      </div>
      {showStatus && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 block rounded-full border-2 border-white dark:border-slate-950 ${
            isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
          } ${statusSizeClasses[size]}`}
        />
      )}
    </div>
  );
}
export default UserAvatar;
