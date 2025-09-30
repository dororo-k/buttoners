import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { getAuthenticatedUser } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const me = await getAuthenticatedUser();
    if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const idemKey = req.headers.get('x-idempotency-key');
    const { toUid, amount, note } = await req.json();
    const amt = Number(amount);
    if (!toUid || !amt || amt <= 0) return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
    if (toUid === me.uid) return NextResponse.json({ error: 'cannot gift to self' }, { status: 400 });
    // Load policy (daily/monthly gift limits)
    let DAILY_LIMIT = 3000;
    let MONTHLY_LIMIT: number | null = null;
    try {
      const policy = await db.collection('settings').doc('pointsPolicy').get();
      if (policy.exists) {
        const d = policy.data() as any;
        if (typeof d?.dailyGiftLimit === 'number') DAILY_LIMIT = d.dailyGiftLimit;
        if (typeof d?.monthlyGiftLimit === 'number') MONTHLY_LIMIT = d.monthlyGiftLimit;
      }
    } catch {}

    // Daily limit enforcement (resets daily)
    const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
    const todaySentSnap = await db.collection('pointTransactions')
      .where('uid', '==', me.uid)
      .where('type', '==', 'gift-sent')
      .where('createdAt', '>=', startOfDay)
      .get();
    let sentToday = 0;
    todaySentSnap.forEach((d) => {
      const a = Number((d.data() as any)?.amount || 0); // negative
      sentToday += Math.abs(a);
    });
    if (sentToday + amt > DAILY_LIMIT) {
      return NextResponse.json({ error: `일일 선물 한도(${DAILY_LIMIT}P)를 초과합니다. 오늘 남은 한도: ${Math.max(0, DAILY_LIMIT - sentToday)}P` }, { status: 400 });
    }

    // Monthly limit enforcement (optional)
    if (MONTHLY_LIMIT && MONTHLY_LIMIT > 0) {
      const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
      const monthSnap = await db.collection('pointTransactions')
        .where('uid', '==', me.uid)
        .where('type', '==', 'gift-sent')
        .where('createdAt', '>=', startOfMonth)
        .get();
      let sentMonth = 0;
      monthSnap.forEach((d) => { const a = Number((d.data() as any)?.amount || 0); sentMonth += Math.abs(a); });
      if (sentMonth + amt > MONTHLY_LIMIT) {
        return NextResponse.json({ error: `월 선물 한도(${MONTHLY_LIMIT}P)를 초과합니다. 이번 달 남은 한도: ${Math.max(0, MONTHLY_LIMIT - sentMonth)}P` }, { status: 400 });
      }
    }

    const fromRef = db.collection('users').doc(me.uid);
    const toRef = db.collection('users').doc(toUid);

    await db.runTransaction(async (tx) => {
      // Idempotency guard
      if (idemKey) {
        const idemRef = db.collection('idempotency').doc(`${me.uid}:${idemKey}`);
        const idemSnap = await tx.get(idemRef);
        if (idemSnap.exists) {
          // Already processed, return early by throwing a sentinel and catching outside
          throw new Error(`IDEMPOTENT:${idemSnap.get('newPoints')}`);
        }
      }
      const fromSnap = await tx.get(fromRef);
      if (!fromSnap.exists) throw new Error('sender not found');
      const toSnap = await tx.get(toRef);
      if (!toSnap.exists) throw new Error('recipient not found');

      const fromData = fromSnap.data() as any;
      const toData = toSnap.data() as any;
      const fromPoints = Number(fromData.points || 0);
      if (fromPoints < amt) throw new Error('insufficient points');
      const toPoints = Number(toData.points || 0);

      tx.update(fromRef, { points: fromPoints - amt });
      tx.update(toRef, { points: toPoints + amt });

      await db.collection('pointTransactions').add({
        uid: me.uid,
        userName: fromData.name,
        userNickname: fromData.nickname,
        type: 'gift-sent',
        itemsSummary: toData.name || toUid, // recipient name
        amount: -amt,
        reason: note || '',
        createdAt: new Date(),
      });
      await db.collection('pointTransactions').add({
        uid: toUid,
        userName: toData.name,
        userNickname: toData.nickname,
        type: 'gift-received',
        itemsSummary: fromData.name || me.uid, // sender name
        amount: amt,
        reason: note || '',
        createdAt: new Date(),
      });
      if (idemKey) {
        const idemRef = db.collection('idempotency').doc(`${me.uid}:${idemKey}`);
        tx.set(idemRef, { type: 'gift', newPoints: fromPoints - amt, createdAt: new Date() });
      }
    });

    // return latest sender points
    const after = await fromRef.get();
    return NextResponse.json({ newPoints: after.get('points') });
  } catch (e: any) {
    // Handle idempotent early return
    if (typeof e?.message === 'string' && e.message.startsWith('IDEMPOTENT:')) {
      const newPoints = Number(e.message.split(':')[1] || 'NaN');
      if (Number.isFinite(newPoints)) return NextResponse.json({ newPoints });
    }
    return NextResponse.json({ error: e?.message || 'gift failed' }, { status: 500 });
  }
}
