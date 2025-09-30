'use server';

import { revalidatePath } from 'next/cache';
import { getAuthenticatedUser } from '@/lib/session';
import { db } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';
import type { Notice } from '@/types/notice';

// --- 에러 처리 헬퍼 ---
class AuthError extends Error {
  constructor(message = '인증이 필요합니다.') {
    super(message);
    this.name = 'AuthError';
  }
}

class PermissionError extends Error {
  constructor(message = '관리자 권한이 필요합니다.') {
    super(message);
    this.name = 'PermissionError';
  }
}

// --- 공지사항 추가 액션 ---
export async function addNoticeAction(prevState: any, formData: FormData): Promise<{ message: string }> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) throw new AuthError();
    if (user.position !== 'admin') throw new PermissionError();

    const title = formData.get('title') as string;
    const body = formData.get('body') as string;
    if (!title || !body) {
      return { message: '제목과 내용은 필수입니다.' };
    }

    const counterRef = db.collection('counters').doc('notices');
    const noticeRef = db.collection('notices').doc();

    await db.runTransaction(async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        const newNo = (counterDoc.data()?.lastNo || 0) + 1;
        transaction.update(counterRef, { lastNo: newNo });

        const newNotice: Omit<Notice, 'id'> = {
            no: newNo,
            title,
            body,
            authorUid: user.uid,
            authorName: user.nickname,
            pinned: false,
            viewCount: 0,
            createdAt: Timestamp.now().toDate().toISOString(),
            updatedAt: Timestamp.now().toDate().toISOString(),
        };
        transaction.set(noticeRef, newNotice);
    });

  } catch (error) {
    console.error('addNoticeAction Error:', error);
    if (error instanceof AuthError || error instanceof PermissionError) {
      return { message: error.message };
    }
    return { message: '공지사항 작성 중 오류가 발생했습니다.' };
  }

  revalidatePath('/notices');
  return { message: 'success' };
}

// --- 공지사항 삭제 액션 ---
export async function deleteNoticeAction(noticeId: string, formData: FormData): Promise<void> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) throw new AuthError();
    if (user.position !== 'admin') throw new PermissionError();

    if (!noticeId) {
        throw new Error('ID가 필요합니다.');
    }

    await db.collection('notices').doc(noticeId).delete();

  } catch (error) {
    console.error('deleteNoticeAction Error:', error);
    // 에러를 다시 throw하여 상위 에러 바운더리에서 처리하도록 함
    throw error;
  }

  revalidatePath('/notices');
}
