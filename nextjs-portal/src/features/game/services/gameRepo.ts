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
import type { Timestamp } from 'firebase/firestore';
import type { GameItem } from '@/types/game';

const COL = 'games';

export function subscribeGames(cb: (items: (GameItem & { createdAt?: Timestamp | null; updatedAt?: Timestamp | null })[]) => void) {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })) as GameItem[];
    cb(list);
  });
}

export async function addGameFs(input: Omit<GameItem, 'id'>) {
  await addDoc(collection(db, COL), { ...input, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function updateGameFs(id: string, patch: Partial<GameItem>) {
  const { id: _omit, ...rest } = patch;
  void _omit;
  await updateDoc(doc(db, COL, id), { ...rest, updatedAt: serverTimestamp() });
}

export async function deleteGameFs(id: string) {
  await deleteDoc(doc(db, COL, id));
}

