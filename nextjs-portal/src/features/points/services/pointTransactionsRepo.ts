import { db } from '@/lib/firebaseClient';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, where } from 'firebase/firestore';

export type PointTransaction = {
  id: string;
  uid: string;
  userName?: string;
  userNickname?: string;
  type: 'purchase' | 'refund' | 'gift-sent' | 'gift-received' | 'admin-adjust' | 'monthly-set';
  itemsSummary?: string; // e.g., "아메리카노x2, 라떼x1"
  amount: number; // negative for purchase, positive for refund
  reason?: string; // refund reason
  createdAt?: any;
  relatedId?: string; // purchase transaction id for refund
  refunded?: boolean; // on purchase
};

const COL = 'pointTransactions';

export function subscribeUserTransactions(uid: string, cb: (txs: PointTransaction[]) => void) {
  const q = query(collection(db, COL), where('uid', '==', uid), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const list: PointTransaction[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    cb(list);
  });
}

export function subscribeAllTransactions(cb: (txs: PointTransaction[]) => void) {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const list: PointTransaction[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    cb(list);
  });
}

export async function addPurchaseTransaction(input: {
  uid: string;
  userName?: string;
  userNickname?: string;
  itemsSummary: string;
  amount: number; // negative
}) {
  await addDoc(collection(db, COL), {
    type: 'purchase',
    refunded: false,
    createdAt: serverTimestamp(),
    ...input,
  });
}
