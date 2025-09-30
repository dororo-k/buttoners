import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// 주의: 빌드 단계에서 환경변수가 없으면 에러가 발생하지 않도록
// 모듈 로드시 즉시 throw 하지 않고, 가능할 때만 초기화합니다.

type AdminExports = { auth: admin.auth.Auth; db: Firestore };

let cached: AdminExports | null = null;

function canInit() {
  return (
    !!process.env.FIREBASE_PROJECT_ID &&
    !!process.env.FIREBASE_CLIENT_EMAIL &&
    !!process.env.FIREBASE_PRIVATE_KEY
  );
}

function initIfPossible(): AdminExports | null {
  if (cached) return cached;
  if (!canInit()) return null;

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  } as const;

  if (!getApps().length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as any),
    });
  }

  cached = { auth: admin.auth(), db: getFirestore() };
  return cached;
}

// 사용처 호환을 위해 동일한 이름으로 내보내되,
// 빌드 시점에는 null일 수 있습니다. 런타임에서 접근 시 에러가 발생하면
// 핸들러의 try/catch에서 처리하도록 합니다.
// 타입은 구체 타입으로 내보내되, 초기화가 불가한 경우에도 빌드 타임 에러는 방지합니다.
// (런타임에 환경변수가 없으면 실제 접근 시 에러가 발생할 수 있습니다.)
export const auth: admin.auth.Auth = (initIfPossible()?.auth as unknown as admin.auth.Auth);
export const db: Firestore = (initIfPossible()?.db as unknown as Firestore);

// 필요 시 명시적으로 필요 시점에 보장하는 헬퍼
export function requireAdmin(): AdminExports {
  const inited = initIfPossible();
  if (!inited) {
    throw new Error(
      'Firebase Admin SDK 환경변수 누락: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY'
    );
  }
  return inited;
}
