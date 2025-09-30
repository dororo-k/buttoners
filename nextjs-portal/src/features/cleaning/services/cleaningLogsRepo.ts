import { db } from '@/lib/firebaseClient';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  Timestamp,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

export interface CleaningLogDoc {
  id: string;
  taskId: string;
  taskTitle: string;
  doneBy: string;
  at: string; // ISO string on client mapping
}

const COL = 'cleaningLogs';

export function subscribeCleaningLogs(cb: (logs: CleaningLogDoc[]) => void) {
  const q = query(collection(db, COL), orderBy('at', 'desc'));
  return onSnapshot(q, (snap) => {
    const list: CleaningLogDoc[] = snap.docs.map((d) => {
      const data = d.data() as any;
      let atIso = '';
      const at = data?.at as Timestamp | undefined;
      if (at && typeof at.toDate === 'function') {
        atIso = at.toDate().toISOString();
      } else if (typeof data?.at === 'string') {
        atIso = data.at;
      }
      return {
        id: d.id,
        taskId: data.taskId,
        taskTitle: data.taskTitle,
        doneBy: data.doneBy,
        at: atIso,
      } as CleaningLogDoc;
    });
    cb(list);
  });
}

export async function addCleaningLog(taskId: string, taskTitle: string, doneBy: string) {
  await addDoc(collection(db, COL), {
    taskId,
    taskTitle,
    doneBy,
    at: serverTimestamp(),
  });
}

export async function deleteCleaningLog(id: string) {
  await deleteDoc(doc(db, COL, id));
}

export async function addCleaningLogAt(taskId: string, taskTitle: string, doneBy: string, dateISO: string) {
  // Write a fixed timestamp for the specified day (noon to avoid TZ edge cases)
  const at = Timestamp.fromDate(new Date(`${dateISO}T12:00:00`));
  await addDoc(collection(db, COL), {
    taskId,
    taskTitle,
    doneBy,
    at,
  });
}

export function aggregateLeaderboard(logs: CleaningLogDoc[]): { doneBy: string; count: number }[] {
  const map = new Map<string, number>();
  for (const l of logs) {
    if (!l.doneBy) continue;
    map.set(l.doneBy, (map.get(l.doneBy) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([doneBy, count]) => ({ doneBy, count }))
    .sort((a, b) => b.count - a.count);
}
