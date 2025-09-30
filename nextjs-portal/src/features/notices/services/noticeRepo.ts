import { db } from '@/lib/firebaseClient';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  increment,
  updateDoc,
  runTransaction,
  limit,
  where,
} from 'firebase/firestore';
import type { Notice } from '@/types/notice';

const COL = 'notices';

// Firestore의 Notice 문서 타입을 정의합니다.
type NoticeFsDoc = Omit<Notice, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

// Firestore 데이터를 Notice 타입으로 변환하는 함수
function toNotice(id: string, data: Partial<NoticeFsDoc>): Notice {
  return {
    id,
    no: typeof data.no === 'number' ? data.no : 0,
    title: data.title ?? '',
    body: data.body ?? '',
    pinned: !!data.pinned,
    authorName: data.authorName ?? '-',
    viewCount: typeof data.viewCount === 'number' ? data.viewCount : 0,
    createdAt: (data.createdAt ?? Timestamp.now()).toDate().toISOString(),
    updatedAt: (data.updatedAt ?? Timestamp.now()).toDate().toISOString(),
  };
}

export function subscribeNotices(cb: (items: Notice[]) => void, errorCb?: (error: Error) => void) {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      const list: Notice[] = snap.docs.map((d) => toNotice(d.id, d.data() as Partial<NoticeFsDoc>));
      cb(list);
    },
    (err) => {
      console.error('[subscribeNotices] Firestore onSnapshot error:', err);
      errorCb?.(err);
    }
  );
}

export async function getNoticesOnce(): Promise<Notice[]> {
  try {
    const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => toNotice(d.id, d.data() as Partial<NoticeFsDoc>));
  } catch (error) {
    console.error('[getNoticesOnce] Error:', error);
    throw new Error('공지사항 목록을 불러오는 데 실패했습니다.');
  }
}

export async function addNotice(
  input: { title: string; body: string; pinned?: boolean; authorName?: string }
): Promise<void> {
  const newDocRef = doc(collection(db, COL));

  await runTransaction(db, async (transaction) => {
    const counterRef = doc(db, 'counters', 'notices');
    const counterSnap = await transaction.get(counterRef);

    let newNo = 1;
    if (counterSnap.exists()) {
      newNo = (counterSnap.data()?.lastNo || 0) + 1;
    }
    transaction.set(counterRef, { lastNo: newNo });

    const postData = {
      ...input,
      authorName: input.authorName ?? '-',
      viewCount: 0,
      no: newNo,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    transaction.set(newDocRef, postData);
  });
}

export async function updateNotice(id: string, patch: Partial<Notice>) {
  try {
    const { id: _omit, createdAt: _c, ...rest } = patch;
    await updateDoc(doc(db, COL, id), { ...rest, updatedAt: serverTimestamp() });
  } catch (error) {
    console.error(`[updateNotice] Error updating notice ${id}:`, error);
    throw new Error('공지사항 업데이트에 실패했습니다.');
  }
}

export async function deleteNotice(id: string) {
  try {
    await deleteDoc(doc(db, COL, id));
  } catch (error) {
    console.error(`[deleteNotice] Error deleting notice ${id}:`, error);
    throw new Error('공지사항 삭제에 실패했습니다.');
  }
}

export async function togglePin(id: string, pinned: boolean) {
  try {
    await updateDoc(doc(db, COL, id), { pinned });
  } catch (error) {
    console.error(`[togglePin] Error toggling pin status for notice ${id}:`, error);
    throw new Error('공지사항 고정 상태 업데이트에 실패했습니다.');
  }
}

export async function getNotice(no: number): Promise<Notice | null> {
  try {
    const q = query(collection(db, COL), where('no', '==', no), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return toNotice(snap.docs[0].id, snap.docs[0].data() as Partial<NoticeFsDoc>);
  } catch (error) {
    console.error(`[getNotice] Error fetching notice no ${no}:`, error);
    throw new Error('공지사항을 불러오는 데 실패했습니다.');
  }
}

export async function incrementViewCount(id: string) {
  try {
    const docRef = doc(db, COL, id);
    await updateDoc(docRef, { viewCount: increment(1) });
  } catch (error) {
    console.error(`[incrementViewCount] Error for notice ${id}:`, error);
  }
}
