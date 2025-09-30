import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/session';

export async function GET() {
  try {
    const me = await getAuthenticatedUser();
    return NextResponse.json({
      authenticated: !!me,
      user: me || null,
    });
  } catch (err: any) {
    return NextResponse.json({ authenticated: false, error: err?.message || 'unknown' }, { status: 500 });
  }
}

