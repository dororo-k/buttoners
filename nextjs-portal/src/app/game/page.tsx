'use client';

import PageLayout from '@/components/PageLayout';
import { useState } from 'react';
import GameList from '@/features/game/components/GameList';
import GameForm from '@/features/game/components/GameForm';
import { useAppStore } from '@/components/providers/StoreProvider';
import type { GameItem as GameItemType } from '@/types/game';

export default function GamePage() {
  const isAdmin = useAppStore('adminSession', (state) => state.isAdmin);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<GameItemType | null>(null);

  const handleEdit = (game: GameItemType) => {
    setEditingGame(game);
    setIsFormOpen(true);
  };

  const handleAddClick = () => {
    setEditingGame(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingGame(null);
  };

  return (
    <PageLayout
      title="게임 관리"
      description="게임 기기의 상태를 확인하고 보수 내역을 관리합니다."
    >
      <div className="flex items-center justify-end mt-6">
        {isAdmin && (
          <button type="button" onClick={handleAddClick} className="btn-primary">새 게임 추가</button>
        )}
      </div>
      <div className="mt-6"><GameList onEdit={handleEdit} /></div>
      <GameForm isOpen={isFormOpen} onClose={handleFormClose} gameToEdit={editingGame} />
    </PageLayout>
  );
}
