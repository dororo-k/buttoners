﻿import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface PointsUIState {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

const usePointsUIStore = create<PointsUIState>()(
  persist(
    (set) => ({
      activeCategory: 'all',
      setActiveCategory: (category) => set({ activeCategory: category }),
    }),
    {
      name: 'points-ui-storage:v1',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export default usePointsUIStore;
