import { create } from 'zustand';
import type { Account } from '../types';

interface AdminSessionState {
  isAdmin: boolean;
  syncAdminStatus: (currentUser: Omit<Account, 'password'> | null) => void; // New method
}

export const createAdminSessionStore = () =>
  create<AdminSessionState>((set) => ({
    isAdmin: false,
    syncAdminStatus: (currentUser) => {
      set({ isAdmin: currentUser?.position === 'admin' });
    },
  }));

