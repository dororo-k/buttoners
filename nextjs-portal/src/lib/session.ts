import { cookies } from 'next/headers';
import { requireAdmin } from './firebaseAdmin';

/**
 * 서버 환경에서 인증된 사용자 정보를 나타냅니다.
 */
export interface AuthenticatedUser {
  uid: string;
  email: string;
  name: string;
  nickname: string;
  position: 'admin' | 'buttoner';
  points: number;
  exp: number;
  favorites?: string[];
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('__session')?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const { auth, db } = requireAdmin();
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    const uid = decodedClaims.uid;

    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return null;
    }

    const accountData = userDoc.data()!;
    return {
      uid: uid,
      email: accountData.email || '',
      name: accountData.name || '',
      nickname: accountData.nickname || '',
      position: accountData.position || 'buttoner',
      points: accountData.points || 0,
      exp: accountData.exp || 0,
      favorites: accountData.favorites || [],
    };
  } catch (error) {
    console.error('Error verifying session cookie or fetching user data:', error);
    cookieStore.delete('__session');
    return null;
  }
}
