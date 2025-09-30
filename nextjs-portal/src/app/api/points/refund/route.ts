import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { getAuthenticatedUser } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const { purchaseId, amount, reason } = await req.json();
    if (!purchaseId || !amount || !reason) return NextResponse.json({ error: 'invalid payload' }, { status: 400 });

    const purchaseRef = db.collection('pointTransactions').doc(purchaseId);
    const snap = await purchaseRef.get();
    if (!snap.exists) return NextResponse.json({ error: 'purchase not found' }, { status: 404 });
    const data = snap.data() as any;
    if (data.type !== 'purchase') return NextResponse.json({ error: 'not a purchase' }, { status: 400 });
    if (data.refunded) return NextResponse.json({ error: 'already refunded' }, { status: 400 });
    if (data.uid !== user.uid && user.position !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    // Update user points and write refund atomically
    const userRef = db.collection('users').doc(data.uid);
    await db.runTransaction(async (tx) => {
      const userDoc = await tx.get(userRef);
      const currentPoints = Number(userDoc.get('points') || 0);
      const newPoints = currentPoints + Number(amount);
      tx.update(userRef, { points: newPoints });
      const refundRef = db.collection('pointTransactions').doc();
      tx.set(refundRef, {
        uid: data.uid,
        userName: data.userName,
        userNickname: data.userNickname,
        type: 'refund',
        itemsSummary: data.itemsSummary,
        amount: Number(amount),
        reason,
        relatedId: purchaseId,
        createdAt: new Date(),
      });
      tx.update(purchaseRef, { refunded: true, refundRef: refundRef.id });
    });

    // return latest points
    const updatedUser = await userRef.get();
    return NextResponse.json({ newPoints: updatedUser.get('points') });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'refund failed' }, { status: 500 });
  }
}

