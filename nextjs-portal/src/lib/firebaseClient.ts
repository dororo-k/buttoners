import { initializeApp, getApps } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import {
  getFirestore,
  initializeFirestore,
  setLogLevel,
  doc,
  collection,
  updateDoc,
  deleteDoc,
  increment,
  arrayUnion,
  arrayRemove,
  getDoc,
} from 'firebase/firestore';
import type { Comment } from '../features/board/types';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// ENV 기반 Firebase 설정 (Vercel 배포 시 대시보드에 등록)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
} as const;

function assertFirebaseEnv(cfg: typeof firebaseConfig) {
  const required: Array<[keyof typeof firebaseConfig, string]> = [
    ['apiKey', 'NEXT_PUBLIC_FIREBASE_API_KEY'],
    ['authDomain', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'],
    ['projectId', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID'],
    ['appId', 'NEXT_PUBLIC_FIREBASE_APP_ID'],
  ];
  const missing = required.filter(([k]) => !cfg[k]);
  if (missing.length) {
    const names = missing.map(([, n]) => n).join(', ');
    throw new Error(
      `Firebase 환경변수 누락: ${names}.\n` +
        `nextjs-portal/.env.local 및 Vercel Project Settings의 Environment Variables에 NEXT_PUBLIC_FIREBASE_* 값을 설정하세요.`
    );
  }
}

assertFirebaseEnv(firebaseConfig);

// 중복초기화 방지
const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

// 오프라인/프록시 환경에서 실시간 연결 안정화를 위해 롱폴링 스트림 옵션 조정
try {
  initializeFirestore(app, {
    experimentalForceLongPolling: true,
    experimentalAutoDetectLongPolling: true,
    longPollingOptions: { timeoutSeconds: 30 },
  } as any);
} catch {
  // 이미 초기화된 경우 무시
}

try {
  if (process.env.NEXT_PUBLIC_FIREBASE_DEBUG === 'true') {
    setLogLevel('debug');
    // 브라우저 콘솔에서 식별하기 쉽게
    if (typeof window !== 'undefined') {
      (window as any).__FIREBASE_DEBUG__ = true;
    }
  } else {
    setLogLevel('error');
  }
} catch {
  // noop
}

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Analytics는 브라우저 환경에서만 초기화
// Analytics: initialize only in browser
let analytics: ReturnType<typeof getAnalytics> | undefined;

if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch {
    // noop
  }
}
export { analytics };

export const deleteComment = async (boardId: string, commentId: string) => {
  const commentRef = doc(db, 'boards', boardId, 'comments', commentId);
  await deleteDoc(commentRef);
};

export const updateComment = async (
  boardId: string,
  updatedComment: Partial<Comment>
) => {
  if (!updatedComment.id) {
    throw new Error('Comment ID is required for update.');
  }
  const commentRef = doc(db, 'boards', boardId, 'comments', updatedComment.id);
  await updateDoc(commentRef, updatedComment);
};

export const toggleCommentLike = async (
  boardId: string,
  commentId: string,
  userId: string
) => {
  const commentRef = doc(db, 'boards', boardId, 'comments', commentId);
  const commentDoc = await getDoc(commentRef);
  if (!commentDoc.exists()) {
    throw new Error('Comment not found.');
  }

  const commentData = commentDoc.data();
  const likedBy: string[] = commentData?.likedByUsers || [];

  if (likedBy.includes(userId)) {
    // Unlike
    await updateDoc(commentRef, {
      likes: increment(-1),
      likedByUsers: arrayRemove(userId),
    });
  } else {
    // Like
    await updateDoc(commentRef, {
      likes: increment(1),
      likedByUsers: arrayUnion(userId),
    });
  }
};

export default app;
