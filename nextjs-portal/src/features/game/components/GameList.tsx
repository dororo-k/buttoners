import React, { useEffect, useState } from 'react';
import type { GameItem as GameItemType } from '../types';
import { GameItem } from './GameItem';
import AdminOnly from '@/components/AdminOnly';
import { subscribeGames, deleteGameFs } from '../services/gameRepo';

interface GameListProps {
  onEdit: (game: GameItemType) => void;
}

const GameList: React.FC<GameListProps> = ({ onEdit }) => {
  const [games, setGames] = useState<GameItemType[]>([]);

  useEffect(() => {
    const unsub = subscribeGames(setGames);
    return () => unsub();
  }, []);

  if (games.length === 0) return <p className="text-gray-600">등록된 게임이 없습니다.</p>;

  return (
    <div className="space-y-2">
      {games.map((game) => (
        <div key={game.id} className="flex items-start justify-between">
          <GameItem game={game} onEdit={onEdit} />
          <AdminOnly>
            <div className="flex items-center gap-2">
              <button className="btn-ghost text-xs px-2 py-1" onClick={() => onEdit(game)}>수정</button>
              <button className="btn-ghost text-xs px-2 py-1 text-red-500 hover:bg-red-500/10" onClick={() => deleteGameFs(game.id)}>삭제</button>
            </div>
          </AdminOnly>
        </div>
      ))}
    </div>
  );
};

export default GameList;