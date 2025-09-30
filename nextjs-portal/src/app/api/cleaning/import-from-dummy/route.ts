import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { promises as fsp } from 'fs';
import path from 'path';
import { db } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { getAuthenticatedUser } from '@/lib/session';

function findFile(): string | null {
  const candidates = [
    path.resolve(process.cwd(), 'cleaning_data.json'),
    path.resolve(process.cwd(), '..', 'cleaning_data.json'),
    path.resolve(process.cwd(), '../../cleaning_data.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export async function POST(_req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || user.position !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  try {
    const filePath = findFile();
    if (!filePath) return NextResponse.json({ error: 'cleaning_data.json not found' }, { status: 404 });
    const txt = await fsp.readFile(filePath, 'utf8');
    const raw = JSON.parse(txt);

    const items = Array.isArray(raw?.tasks) ? raw.tasks : [];
    if (!items.length) {
      return NextResponse.json({ imported: 0, message: 'no tasks in file' });
    }

    const batch = db.batch();
    const col = db.collection('cleaningTasks');
    let count = 0;
    for (const t of items) {
      const docRef = col.doc();
      const mapped = {
        title: t.cleaning_content || '무제',
        category: t.category || '기타',
        interval: { type: 'everyN', n: Number(t.interval) || 0 },
        lastDoneAt: null,
        active: true,
        checklist: [],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      batch.set(docRef, mapped);
      count++;
    }
    await batch.commit();
    return NextResponse.json({ imported: count });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed to import' }, { status: 500 });
  }
}

