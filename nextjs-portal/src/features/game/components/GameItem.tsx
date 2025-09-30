import React from 'react';

import type { GameItem as GameItemType } from '../types';
import { useAppStore } from '@/components/providers/StoreProvider';

import useGameStore from '../stores/useGameStore';

interface GameItemProps {
  game: GameItemType;
  onEdit: (game: GameItemType) => void;
}

export const GameItem: React.FC<GameItemProps> = ({ game, onEdit }) => {
  const isAdmin = useAppStore('adminSession', (state) => state.isAdmin);
  const { deleteGame } = useGameStore();

  const handleDelete = () => {
    if (window.confirm(`'${game.name}' 게임을 삭제하시겠습니까?`)) {
      deleteGame(game.id);
    }
  };

  const getStatusColor = (status: GameItemType['status']) => {
    switch (status) {
      case 'ok':
        return 'bg-green-200 text-green-800';
      case 'repair':
        return 'bg-yellow-200 text-yellow-800';
      case 'missing':
        return 'bg-red-200 text-red-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4 flex justify-between items-center">
      <div>
        <h3 className="text-lg font-semibold">{game.name}</h3>
        <p className={`text-sm font-medium px-2 py-1 rounded-full ${getStatusColor(game.status)}`}>
          상태: {game.status === 'ok' ? '정상' : game.status === 'repair' ? '수리 중' : '분실'}
        </p>
        {game.tags && game.tags.length > 0 && (
          <p className="text-gray-600 text-xs mt-1">태그: {game.tags.join(', ')}</p>
        )}
        {game.notes && (
          <p className="text-gray-600 text-xs mt-1">비고: {game.notes}</p>
        )}
      </div>
      {isAdmin && (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(game)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full text-sm"
          >
            수정
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full text-sm"
          >
            삭제
          </button>
        </div>
      )}
    </div>
  );
};