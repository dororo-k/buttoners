

import { create } from 'zustand';
import { collection, doc, getDoc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebaseClient';
import type { Account } from '../../../types'; // Import Account from canonical types

interface StaffState {
  addStaff: (account: Account) => Promise<void>;
  removeStaff: (uid: string) => Promise<void>;
  updateStaffPassword: (uid: string, newPasswordHash: string) => Promise<void>;
  findStaffByUid: (uid: string) => Promise<Account | undefined>;
  getStaffList: () => Promise<Account[]>;
}

const useStaffStore = create<StaffState>(() => ({
  addStaff: async (account) => {
    await setDoc(doc(db, 'users', account.uid), account);
  },
  removeStaff: async (uid) => {
    // In a real app, you'd delete the document
    // await deleteDoc(doc(db, 'users', uid));
    console.warn(`Staff removal for ${uid} not fully implemented for Firestore.`);
  },
  updateStaffPassword: async (uid, newPasswordHash) => {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { hashedPassword: newPasswordHash }, { merge: true });
  },
  findStaffByUid: async (uid) => {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as Account;
      return {
        ...data,
        points: data.points ?? 0, // Default to 0 if undefined
        exp: data.exp ?? 0,     // Default to 0 if undefined
        favorites: data.favorites ?? [],
      };
    }
    return undefined;
  },
  getStaffList: async () => {
    const usersCol = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCol);
    return usersSnapshot.docs.map((doc) => {
      const data = doc.data() as Account;
      return {
        ...data,
        points: data.points ?? 0, // Default to 0 if undefined
        exp: data.exp ?? 0,     // Default to 0 if undefined
        favorites: data.favorites ?? [],
      };
    });
  },
}));

export default useStaffStore;
