import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

function startOfWeek(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day; // Sunday as start
  return new Date(date.getFullYear(), date.getMonth(), diff, 0, 0, 0, 0);
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'all'; // all | week | month

    let queryRef: FirebaseFirestore.Query = db.collection('cleaningLogs');

    if (range === 'week') {
      const start = startOfWeek();
      queryRef = queryRef.where('at', '>=', start);
    } else if (range === 'month') {
      const start = startOfMonth();
      queryRef = queryRef.where('at', '>=', start);
    }

    const snap = await queryRef.get();
    const map = new Map<string, number>();
    snap.forEach((doc) => {
      const d = doc.data() as any;
      const who = d?.doneBy || 'unknown';
      map.set(who, (map.get(who) || 0) + 1);
    });

    const leaderboard = Array.from(map.entries())
      .map(([doneBy, count]) => ({ doneBy, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ leaderboard });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load leaderboard' }, { status: 500 });
  }
}

