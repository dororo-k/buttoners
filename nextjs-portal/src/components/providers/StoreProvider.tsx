'use client';

import { type ReactNode, createContext, useRef, useContext, useEffect } from 'react';
import { useStore } from 'zustand';

import { createAdminSessionStore } from '@/store/useAdminSession';
import { createStaffSessionStore } from '@/features/staff/hooks/useStaffSession';
import { createNoticeStore } from '@/store/useNoticeStore';
import { createBoardStore } from '@/store/useBoardStore';
import { createCleaningStore } from '@/store/useCleaningStore';
import { createGameStore } from '@/store/useGameStore';
import { createPointStore } from '@/features/points/store/usePointStore';
import { AuthenticatedUser } from '@/lib/session'; // Import AuthenticatedUser type
import { createMenuStore } from '@/store/useMenuStore';
import useProductStore from '@/store/useProductStore';
import usePointsUIStore from '@/features/points/store/usePointsUIStore';
import { db } from '@/lib/firebaseClient';
import { doc, onSnapshot } from 'firebase/firestore';


// Combine all store creators
const createRootStore = (initialCurrentUser: AuthenticatedUser | null) => ({
  adminSession: createAdminSessionStore(),
  staffSession: createStaffSessionStore({}, initialCurrentUser), // Pass initialCurrentUser
  noticeStore: createNoticeStore(),
  boardStore: createBoardStore(),
  cleaningStore: createCleaningStore(),
  gameStore: createGameStore(),
  pointStore: createPointStore({ userPoints: initialCurrentUser?.points || 0 }), // Pass initial points
  menuStore: createMenuStore(),
  productStore: useProductStore,
  pointsUIStore: usePointsUIStore,
  // ... add other stores here
});

export type RootStore = ReturnType<typeof createRootStore>;

type ExtractState<S> = S extends { getState: () => infer T } ? T : never;


const StoreContext = createContext<RootStore | null>(null);

export interface StoreProviderProps {
  children: ReactNode;
  initialCurrentUser: AuthenticatedUser | null;
}

export const StoreProvider = ({ children, initialCurrentUser }: StoreProviderProps) => {
  const storeRef = useRef<RootStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = createRootStore(initialCurrentUser);
  }

  // Access the store instances from the ref
  const adminSessionStore = storeRef.current.adminSession;
  const staffSessionStore = storeRef.current.staffSession;
  const pointStore = storeRef.current.pointStore;

  // Subscribe to staffSession's currentUser changes and sync adminSession's isAdmin status
  useEffect(() => {
    // Sync on initial load
    const current = staffSessionStore.getState().currentUser;
    adminSessionStore.getState().syncAdminStatus(current);
    // Favorites and points sync on initial load
    if (current?.uid) {
      pointStore.getState().fetchUserFavorites(current.uid);
      if (typeof current.points === 'number') {
        pointStore.getState().setUserPoints(current.points);
      }
    } else {
      pointStore.getState().setUserFavorites(new Set());
    }

    // Subscribe to auth changes
    const unsubscribe = staffSessionStore.subscribe((state, prevState) => {
      if (state.currentUser !== prevState.currentUser) {
        // Update admin status
        adminSessionStore.getState().syncAdminStatus(state.currentUser);
        // React to login/logout for favorites and points
        const u = state.currentUser;
        if (u?.uid) {
          pointStore.getState().fetchUserFavorites(u.uid);
          if (typeof u.points === 'number') {
            pointStore.getState().setUserPoints(u.points);
          }
        } else {
          pointStore.getState().setUserFavorites(new Set());
        }
      }
    });

    // Realtime points sync: subscribe to users/{uid}
    let unsubscribeUser: (() => void) | null = null;
    const startUserSub = (uid: string) => {
      try {
        unsubscribeUser?.();
      } catch {}
      unsubscribeUser = onSnapshot(doc(db, 'users', uid), (snap) => {
        const data = snap.data() as any;
        if (!data) return;
        const points = typeof data.points === 'number' ? data.points : 0;
        // Update both staffSession.currentUser.points and pointStore.userPoints
        const cur = staffSessionStore.getState().currentUser;
        if (cur) {
          staffSessionStore.getState().setCurrentUser({ ...cur, points });
        }
        pointStore.getState().setUserPoints(points);
      });
    };

    const cur = staffSessionStore.getState().currentUser;
    if (cur?.uid) startUserSub(cur.uid);

    const unsub2 = staffSessionStore.subscribe((state, prev) => {
      if (state.currentUser?.uid !== prev.currentUser?.uid) {
        if (state.currentUser?.uid) startUserSub(state.currentUser.uid);
        else {
          try { unsubscribeUser?.(); } catch {}
          unsubscribeUser = null;
        }
      }
    });

    return () => { try { unsubscribe(); } catch {}; try { unsub2(); } catch {}; try { unsubscribeUser?.(); } catch {} };
  }, [adminSessionStore, staffSessionStore, pointStore]); // Dependencies for useEffect

  return (
    <StoreContext.Provider value={storeRef.current}>
      {children}
    </StoreContext.Provider>
  );
};

// Hook to use a specific store
export const useAppStore = <T extends keyof RootStore, U>(
  storeName: T,
  selector: (state: ExtractState<RootStore[T]>) => U
): U => {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useAppStore must be used within a StoreProvider');
  }
  return useStore(store[storeName], selector);
};
