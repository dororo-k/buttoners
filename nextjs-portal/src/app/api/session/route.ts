import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/firebaseAdmin'; // firebase-admin auth

// 세션 쿠키 생성 (로그인)
export async function POST(request: NextRequest) {
  const { idToken } = await request.json();

  if (!idToken) {
    return NextResponse.json({ message: 'ID Token is missing' }, { status: 400 });
  }

  try {
    const { auth } = requireAdmin();
    // ID 토큰을 사용하여 세션 쿠키 생성
    // 세션 쿠키의 유효 기간: 최대 6시간
    const expiresIn = 60 * 60 * 6 * 1000; // 6시간
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    // 세션 쿠키를 HTTP Only 쿠키로 설정
    const response = NextResponse.json({ success: true });
    response.cookies.set('__session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // 프로덕션에서는 HTTPS만 허용
      path: '/',
      sameSite: 'lax',
    });
    return response;
  } catch (error: any) {
    console.error('Error creating session cookie:', error);
    return NextResponse.json({ message: error.message || 'Failed to create session cookie' }, { status: 500 });
  }
}

// 세션 쿠키 삭제 (로그아웃)
export async function DELETE(request: NextRequest) {
  try {
    const { /* auth */ } = requireAdmin();
    const sessionCookie = request.cookies.get('__session')?.value;
    if (sessionCookie) {
      // 세션 쿠키를 무효화 (Firebase Admin SDK) - 이 메서드는 존재하지 않으므로 제거
      // await auth.revokeSessionCookies([sessionCookie]);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set('__session', '', {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });
    return response;
  } catch (error: any) {
    console.error('Error revoking session cookie:', error);
    return NextResponse.json({ message: error.message || 'Failed to revoke session cookie' }, { status: 500 });
  }
}
