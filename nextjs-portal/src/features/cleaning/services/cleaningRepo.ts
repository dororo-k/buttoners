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
import type { CleaningTask } from '../types';

const COL = 'cleaningTasks';

export function subscribeCleaningTasks(cb: (items: CleaningTask[]) => void) {
  const q = query(collection(db, COL), orderBy('title'));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })) as CleaningTask[];
    cb(list);
  });
}

export async function addCleaningTask(input: Omit<CleaningTask, 'id'>) {
  await addDoc(collection(db, COL), { ...input, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function updateCleaningTask(id: string, patch: Partial<CleaningTask>) {
  const { id: _omit, ...rest } = patch;
  void _omit;
  await updateDoc(doc(db, COL, id), { ...rest, updatedAt: serverTimestamp() });
}

export async function deleteCleaningTask(id: string) {
  await deleteDoc(doc(db, COL, id));
}

