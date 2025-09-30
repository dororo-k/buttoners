import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';

export interface MenuItem {
  id: string;
  category: string;
  name: string;
  price: number;
}

interface MenuState {
  menu: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, updates: Partial<Omit<MenuItem, 'id'>>) => void;
  removeMenuItem: (id: string) => void;
  getCategories: () => string[];
}

const useMenuStore = create(
  persist<MenuState>(
    (set, get) => ({
      menu: [
        { id: '1', category: '커피', name: '아메리카노', price: 3000 },
        { id: '2', category: '커피', name: '카페라떼', price: 3500 },
        { id: '3', category: '음료', name: '딸기 스무디', price: 4500 },
      ], // 초기 예시 데이터
      addMenuItem: (item) =>
        set(
          produce((state: MenuState) => {
            state.menu.push({ id: uuidv4(), ...item });
          })
        ),
      updateMenuItem: (id, updates) =>
        set(
          produce((state: MenuState) => {
            const itemIndex = state.menu.findIndex((item) => item.id === id);
            if (itemIndex !== -1) {
              state.menu[itemIndex] = { ...state.menu[itemIndex], ...updates };
            }
          })
        ),
      removeMenuItem: (id) => set(produce((state: MenuState) => { state.menu = state.menu.filter((item) => item.id !== id); })),
      getCategories: () => [...new Set(get().menu.map((item) => item.category))],
    }),
    { name: 'portal-menu-storage', storage: createJSONStorage(() => localStorage) }
  )
);

export default useMenuStore;
