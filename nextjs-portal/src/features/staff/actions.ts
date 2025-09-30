'use server';

import { db, auth } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';
import * as bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { Account } from '@/types';
import { RegistrationPayload } from '@/features/staff/hooks/useStaffSession';

// --- 에러 처리 헬퍼 ---
class AuthError extends Error {
  constructor(message = '인증이 필요합니다.') {
    super(message);
    this.name = 'AuthError';
  }
}

// --- 회원가입 서버 액션 ---
export async function createAccountAction(
  prevState: { message: string; token?: string },
  formData: FormData
): Promise<{ message: string; token?: string }> {
  try {
    const name = formData.get('name') as string;
    const nickname = formData.get('nickname') as string;
    const password = formData.get('password') as string;
    const password2 = formData.get('password2') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const employmentStartDate = formData.get('employmentStartDate') as string;
    const position = (formData.get('position') as string) || 'buttoner';

    // 1. 입력값 유효성 검사 (간단하게)
    if (!name || !nickname || !password || !employmentStartDate) {
      return { message: '모든 필수 정보를 입력해주세요.' };
    }
    if (password !== password2) {
      return { message: '비밀번호 확인이 일치하지 않습니다.' };
    }
    if (!/^\d{4}$/.test(password)) {
      return { message: '비밀번호는 숫자 4자리여야 합니다.' };
    }

    // 닉네임 중복 확인
    const dup = await db.collection('users').where('nickname', '==', nickname).limit(1).get();
    if (!dup.empty) {
      return { message: '이미 사용 중인 닉네임입니다.' };
    }

    // 2. 비밀번호 보안 강화: 서버에서 해싱
    const hashedPassword = await bcrypt.hash(password, 10); // saltRounds = 10

    // 3. Firebase Auth 사용자 생성 (전화번호는 E.164로 정규화 가능할 때만 설정)
    let e164: string | undefined = undefined;
    if (phoneNumber) {
      const d = phoneNumber.replace(/\D/g, '');
      if (d.startsWith('0')) e164 = `+82${d.slice(1)}`; // KR 기본 가정
      else if (d.startsWith('82')) e164 = `+${d}`;
      else if (phoneNumber.startsWith('+')) e164 = phoneNumber;
    }
    const userRecord = await auth.createUser({
      displayName: nickname,
      ...(e164 ? { phoneNumber: e164 } : {}),
    });

    // 4. Firestore에 사용자 정보 저장
    const newAccount: Account = {
      uid: userRecord.uid,
      name: name,
      nickname: nickname,
      phoneNumber: phoneNumber,
      employmentStartDate: employmentStartDate,
      position: position,
      points: 0,
      exp: 0,
      // 비밀번호는 해싱된 형태로 Firestore에 저장 (Firebase Auth는 비밀번호를 직접 관리하지 않음)
      password: hashedPassword,
    };

    await db.collection('users').doc(userRecord.uid).set(newAccount);

    // 5. 커스텀 토큰 발급 (클라이언트가 이 토큰으로 Firebase 로그인 후 /api/session 호출)
    const customToken = await auth.createCustomToken(userRecord.uid);
    return { message: 'success', token: customToken };

  } catch (error: any) {
    console.error('loginAction Error:', error);
    return { message: error.message || '로그인 중 오류가 발생했습니다.' };
  }
}

// --- 로그아웃 서버 액션 ---
export async function logoutAction(): Promise<void> {
  try {
    // 서버 액션 응답에 직접 쿠키 삭제를 반영 (클라이언트로 Set-Cookie 전달됨)
    cookies().set('__session', '', {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });
  } catch (error: any) {
    console.error('logoutAction Error:', error);
  }
  redirect('/');
}

// --- 로그인 서버 액션 ---
export async function loginAction(prevState: { message: string; token?: string }, formData: FormData): Promise<{ message: string; token?: string }> {
  try {
    const name = formData.get('name') as string;
    const password = formData.get('password') as string;

    if (!name || !password) {
      return { message: '이름과 비밀번호를 입력해주세요.' };
    }

    // 1. Firestore에서 사용자 조회 (닉네임 기준)
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('nickname', '==', name).limit(1).get();

    if (snapshot.empty) {
      return { message: '사용자를 찾을 수 없습니다.' };
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data() as Account;

    // 2. 비밀번호 검증
    const passwordMatch = await bcrypt.compare(password, userData.password || '');

    if (!passwordMatch) {
      return { message: '비밀번호가 일치하지 않습니다.' };
    }

    // 3. Firebase Admin SDK를 사용하여 커스텀 토큰 생성 (클라이언트에서 ID 토큰으로 교환)
    const customToken = await auth.createCustomToken(userData.uid);
    return { message: 'success', token: customToken };

  } catch (error: any) {
    console.error('loginAction Error:', error);
    return { message: error.message || '로그인 중 오류가 발생했습니다.' };
  }

  // 폼 상태로 토큰을 반환했으므로 여기서는 리디렉션하지 않음
}

// --- 사용자 권한 변경 (임시 스텁) ---
export async function updateUserRoleAction(memberUid: string, newPosition: 'admin' | 'buttoner'): Promise<{ message: string }> {
  // TODO: Implement role update logic with proper auth checks
  return { message: '역할 변경 기능은 아직 구현되지 않았습니다.' };
}
