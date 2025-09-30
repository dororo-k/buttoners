import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { GameItem } from '@/types/game';

interface GameState {
  games: GameItem[];
  addGame: (game: Omit<GameItem, 'id'>) => void;
  updateGame: (id: string, updatedGame: Partial<GameItem>) => void;
  deleteGame: (id: string) => void;
}

const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      games: [],

      addGame: (game) => {
        set((state) => ({
          games: [...state.games, { ...game, id: uuidv4() }],
        }));
      },

      updateGame: (id, updatedGame) => {
        set((state) => ({
          games: state.games.map((game) =>
            game.id === id ? { ...game, ...updatedGame } : game
          ),
        }));
      },

      deleteGame: (id) => {
        set((state) => ({
          games: state.games.filter((game) => game.id !== id),
        }));
      },
    }),
    {
      name: 'game-storage', // unique name
      storage: createJSONStorage(() => localStorage), // use localStorage
    }
  )
);

export default useGameStore;

