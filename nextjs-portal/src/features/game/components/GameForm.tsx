import React, { useEffect, useState } from 'react';

import type { GameItem } from '../types';

import useGameStore from '../stores/useGameStore';
import { addGameFs, updateGameFs } from '../services/gameRepo';

interface GameFormProps {
  isOpen: boolean;
  onClose: () => void;
  gameToEdit?: GameItem | null;
}

const GameForm: React.FC<GameFormProps> = ({ isOpen, onClose, gameToEdit }) => {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<GameItem['status']>('ok');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');

  const { addGame, updateGame } = useGameStore();

  useEffect(() => {
    if (gameToEdit) {
      setName(gameToEdit.name);
      setStatus(gameToEdit.status);
      setTags(gameToEdit.tags ? gameToEdit.tags.join(', ') : '');
      setNotes(gameToEdit.notes || '');
    } else {
      // Reset form for new game
      setName('');
      setStatus('ok');
      setTags('');
      setNotes('');
    }
  }, [gameToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const gameData: Omit<GameItem, 'id'> = {
      name,
      status,
      tags: tags.split(',').map((tag) => tag.trim()).filter((tag) => tag !== ''),
      notes: notes || undefined,
    };

    if (gameToEdit) {
      await updateGameFs(gameToEdit.id, gameData);
      updateGame(gameToEdit.id, gameData);
    } else {
      await addGameFs(gameData);
      addGame(gameData);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">{gameToEdit ? '게임 수정' : '새 게임 추가'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">이름:</label>
            <input
              type="text"
              id="name"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="status" className="block text-gray-700 text-sm font-bold mb-2">상태:</label>
            <select
              id="status"
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={status}
              onChange={(e) => setStatus(e.target.value as GameItem['status'])}
            >
              <option value="ok">정상</option>
              <option value="repair">수리 중</option>
              <option value="missing">분실</option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="tags" className="block text-gray-700 text-sm font-bold mb-2">태그 (쉼표 구분):</label>
            <input
              type="text"
              id="tags"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="notes" className="block text-gray-700 text-sm font-bold mb-2">비고:</label>
            <textarea
              id="notes"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              {gameToEdit ? '수정' : '추가'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GameForm;