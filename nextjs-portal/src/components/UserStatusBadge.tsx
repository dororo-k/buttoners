import React from 'react';
import { Crown, Star } from 'lucide-react';
import type { Account } from '@/types';

interface UserStatusBadgeProps {
  currentUser: Account;
}

export const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({ currentUser }) => {
  const userPoints = currentUser.points ?? 0;
  const userLevel = currentUser.exp ? Math.floor(currentUser.exp / 100) : 0;

  return (
    <div className="flex items-center gap-3 text-sm ml-2">
      <span className="flex items-center gap-1 font-medium text-ink">
        <Star className="h-4 w-4 text-yellow-400" />
        <span className="tabular-nums">{userPoints.toLocaleString()}</span>
      </span>

      {currentUser.position === 'admin' ? (
        <Crown className="h-5 w-5 text-yellow-400" />
      ) : (
        <div className="relative group">
          <span className="text-xs font-bold text-green-400 border border-green-400/50 rounded-md px-1.5 py-0.5 cursor-pointer">
            Lv. {userLevel}
          </span>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max px-2 py-1 bg-elev text-ink text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            EXP: {(currentUser.exp ?? 0) % 100} / 100
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-elev"></div>
          </div>
        </div>
      )}
    </div>
  );
};
