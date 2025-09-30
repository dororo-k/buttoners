import { create } from 'zustand';
import {
  getAuth,
  signInWithCustomToken,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseApp from '../../../lib/firebaseClient';
import useStaffStore from '../store/useStaffStore'; // Assuming this is needed for other operations
import type { Account as StaffAccountType } from '../../../types'; // Import Account from canonical types

import { getFunctions } from 'firebase/functions';

const auth = getAuth(firebaseApp);
// Initialized for potential future use
const functions = getFunctions(firebaseApp);

export type Account = StaffAccountType;

// Type for registration payload, including transient fields like adminConfirm
export type RegistrationPayload = Omit<Account, 'uid'>;

export interface StaffSessionState {
  currentUser: Omit<Account, 'password'> | null;
  isAuthLoading: boolean; // Added
  setCurrentUser: (user: Omit<Account, 'password'> | null) => void;
  sendSmsCode: (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => Promise<ConfirmationResult | null>;
  verifySmsCode: (confirmationResult: ConfirmationResult, code: string) => Promise<boolean>;
  recaptchaVerifier: RecaptchaVerifier | null;
  setRecaptchaVerifier: (verifier: RecaptchaVerifier) => void;
  updateUserPoints: (newPoints: number) => void; // Add this line
  lastError: string | null;
}

export const createStaffSessionStore = (initialState: Partial<StaffSessionState> = {}, initialCurrentUser: Omit<StaffAccountType, 'password'> | null = null) => create<StaffSessionState>((set, get) => {
  return {
    currentUser: initialCurrentUser, // Initialize with server-fetched data
    isAuthLoading: initialCurrentUser === null, // Set to false if initialCurrentUser is provided
    setCurrentUser: (user) => set({ currentUser: user }),
    recaptchaVerifier: null,
    lastError: null,
    setRecaptchaVerifier: (verifier) => set({ recaptchaVerifier: verifier }),

    updateUserPoints: (newPoints: number) => {
      const { currentUser } = get();
      if (currentUser) {
        const updatedUser = { ...currentUser, points: newPoints };
        set({ currentUser: updatedUser });
      }
    },

    sendSmsCode: async (phoneNumber, verifier) => {
      try {
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
        return confirmationResult;
      } catch (error) {
        console.error('SMS 코드 전송 오류:', error);
        return null;
      }
    },

    verifySmsCode: async (confirmationResult, code) => {
      try {
        await confirmationResult.confirm(code);
        return true;
      } catch (error) {
        console.error('SMS 코드 확인 오류:', error);
        return false;
      }
    },
  };
});
