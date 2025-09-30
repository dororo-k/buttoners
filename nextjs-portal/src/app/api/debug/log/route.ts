import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Basic server-side log for correlation
    // eslint-disable-next-line no-console
    console.log('[DEBUG_LOG]', new Date().toISOString(), body?.type || 'log', body);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'parse-failed' }, { status: 400 });
  }
}

