import { db } from '@/lib/firebaseClient';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import type { MenuItem } from '@/types/points';

const COL = 'pointsMenus';

export function subscribeMenus(cb: (items: MenuItem[]) => void) {
  const q = query(collection(db, COL), orderBy('category'));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })) as MenuItem[];
    cb(list);
  });
}

export async function addMenuItemFs(input: Omit<MenuItem, 'id'>) {
  await addDoc(collection(db, COL), { ...input, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function updateMenuItemFs(id: string, patch: Partial<Omit<MenuItem, 'id'>>) {
  await updateDoc(doc(db, COL, id), { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteMenuItemFs(id: string) {
  await deleteDoc(doc(db, COL, id));
}

