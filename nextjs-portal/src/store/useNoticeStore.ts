import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Assuming a global Notice type exists in @/types/index.ts
// We will need to create this type definition.
export interface Notice {
  id: string;
  no: number;
  title: string;
  body: string;
  pinned?: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

interface NoticeState {
  notices: Notice[];
  nextNo: number;
  addNotice: (notice: Omit<Notice, 'id' | 'createdAt' | 'updatedAt' | 'no'>) => void;
  updateNotice: (id: string, updatedNotice: Partial<Notice>) => void;
  deleteNotice: (id: string) => void;
  togglePin: (id: string) => void;
}

function assignNumbersAscendingByCreatedAt(notices: Notice[]) {
  const sorted = [...notices].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  let n = 0;
  const filled = sorted.map((it) => {
    if (typeof it.no === 'number' && it.no > 0) return it;
    n += 1;
    return { ...it, no: n };
  });
  const maxNo = Math.max(0, ...filled.map((x) => x.no ?? 0));
  return { filled, nextNo: maxNo + 1 };
}

interface OldNoticeState {
  notices?: Notice[];
  nextNo?: number;
}

export const createNoticeStore = (initialState: Partial<NoticeState> = {}) => 
  create<NoticeState>()(
    persist(
      (set) => ({
        notices: [],
        nextNo: 1,
        addNotice: (notice) => {
          const now = new Date().toISOString();
          set((state) => {
            const no = state.nextNo ?? 1;
            const newNotice: Notice = {
              ...notice,
              id: uuidv4(),
              no,
              createdAt: now,
              updatedAt: now,
            } as Notice;
            return {
              notices: [...state.notices, newNotice],
              nextNo: no + 1,
            };
          });
        },
        updateNotice: (id, updatedNotice) => {
          const now = new Date().toISOString();
          set((state) => ({
            notices: state.notices.map((notice) =>
              notice.id === id ? { ...notice, ...updatedNotice, updatedAt: now } : notice
            ),
          }));
        },
        deleteNotice: (id) => {
          set((state) => ({
            notices: state.notices.filter((notice) => notice.id !== id),
          }));
        },
        togglePin: (id) => {
          set((state) => ({
            notices: state.notices.map((notice) =>
              notice.id === id ? { ...notice, pinned: !notice.pinned } : notice
            ),
          }));
        },
        ...initialState,
      }),
      {
        name: 'notice-storage',
        storage: createJSONStorage(() => localStorage),
        version: 2,
        migrate: (persistedState: unknown, version) => {
          if (!persistedState) return persistedState;
          const oldState = persistedState as OldNoticeState; // Cast here
          if (version < 2) {
            const notices: Notice[] = oldState.notices ?? []; // Use oldState
            const { filled, nextNo } = assignNumbersAscendingByCreatedAt(notices);
            return {
              ...oldState, // Use oldState
              notices: filled,
              nextNo: nextNo ?? 1,
            };
          }
          if (oldState.nextNo == null) { // Use oldState
            const notices: Notice[] = oldState.notices ?? []; // Use oldState
            const { nextNo } = assignNumbersAscendingByCreatedAt(notices);
            oldState.nextNo = nextNo ?? 1;
          }
          return oldState; // Return oldState
        },
        partialize: (state) => ({
          notices: state.notices,
          nextNo: state.nextNo,
        }),
      }
    )
);

