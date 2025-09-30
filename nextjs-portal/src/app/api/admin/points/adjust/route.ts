import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { getAuthenticatedUser } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const me = await getAuthenticatedUser();
    if (!me || me.position !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    const { uid, delta, reason } = await req.json();
    if (!uid || typeof delta !== 'number') return NextResponse.json({ error: 'invalid payload' }, { status: 400 });

    const userRef = db.collection('users').doc(uid);
    await db.runTransaction(async (tx) => {
      const userDoc = await tx.get(userRef);
      if (!userDoc.exists) throw new Error('user not found');
      const data = userDoc.data() as any;
      const current = Number(data.points || 0);
      const next = current + delta;
      tx.update(userRef, { points: next });
      await db.collection('pointTransactions').add({
        uid,
        userName: data.name,
        userNickname: data.nickname,
        type: 'admin-adjust',
        itemsSummary: '관리자 조정',
        amount: delta,
        reason: reason || '',
        createdAt: new Date(),
      });
    });
    const after = await userRef.get();
    return NextResponse.json({ newPoints: after.get('points') });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'adjust failed' }, { status: 500 });
  }
}

