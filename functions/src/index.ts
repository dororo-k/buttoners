import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as bcrypt from 'bcryptjs';
admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();
// For cost control, you can set the maximum number of containers that can be
// running at the same time.
functions.setGlobalOptions({ maxInstances: 10 });
// Request body interfaces
interface CreateAccountRequest {
  id: string;
  password: string;
  nickname: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  employmentStartDate: string;
  smsVerifiedUid?: string;
}
interface LoginUserRequest {
  nickname: string;
  password: string;
}
// --- 회원가입 Cloud Function (createAccount) ---
exports.createAccount = functions.https.onRequest(async (req, res) => {
  // CORS 헤더 설정
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  const { id, password, nickname, phoneNumber, dateOfBirth, employmentStartDate, smsVerifiedUid } = req.body as CreateAccountRequest;
  // 1. 입력 유효성 검사
  if (!id || !password || !nickname || !employmentStartDate) {
    res.status(400).json({ success: false, message: '필수 필드를 모두 입력해주세요.' });
    return;
  }
  if (password.length !== 4 || !/^[0-9]{4}$/.test(password)) {
    res.status(400).json({ success: false, message: '비밀번호는 4자리 숫자여야 합니다.' });
    return;
  }
  try {
    // 2. 'ID (자신의 이름)' 중복 검사
    const idCheck = await db.collection('users').where('id', '==', id).limit(1).get();
    if (!idCheck.empty) {
      res.status(409).json({ success: false, message: '이미 사용 중인 ID (자신의 이름) 입니다.' });
      return;
    }
    // 3. 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);
    let firebaseUid = smsVerifiedUid; // SMS 본인확인으로 얻은 UID
    // 4. Firebase Authentication 계정 생성 또는 업데이트
    if (!firebaseUid) {
      // SMS 본인확인을 건너뛴 경우, 임시 UID로 계정 생성
      const userRecord = await auth.createUser({
        displayName: nickname,
      });
      firebaseUid = userRecord.uid;
    } else {
      // SMS 본인확인을 한 경우, 해당 UID의 계정 정보 업데이트 (닉네임, 전화번호 등)
      await auth.updateUser(firebaseUid, {
        displayName: nickname,
        phoneNumber: phoneNumber || null,
      });
    }
    // 5. Cloud Firestore에 사용자 정보 저장
    await db.collection('users').doc(firebaseUid).set({
      uid: firebaseUid,
      id: id, // 사용자가 입력한 'ID - 자신의 이름'
      hashedPassword: hashedPassword,
      nickname: nickname,
      phoneNumber: phoneNumber || null,
      employmentStartDate: employmentStartDate,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(200).json({ success: true, message: '회원가입 성공!', uid: firebaseUid });
  } catch (error: any) {
    console.error('회원가입 오류:', error);
    if (error.code === 'auth/email-already-in-use' || error.code === 'auth/phone-number-already-exists') {
      res.status(409).json({ success: false, message: '이미 사용 중인 정보가 있습니다.' });
    } else {
      res.status(500).json({ success: false, message: error.message || '회원가입 중 오류가 발생했습니다.' });
    }
  }
});
// --- 로그인 Cloud Function (loginUser) ---
exports.loginUser = functions.https.onRequest(async (req, res) => {
  // CORS 헤더 설정
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  const { nickname, password } = req.body as LoginUserRequest;
  // 1. 입력 유효성 검사
  if (!nickname || !password) {
    res.status(400).json({ success: false, message: '닉네임과 비밀번호를 입력해주세요.' });
    return;
  }
  // 2. 로그인 시도 제한 (Rate Limiting) - Firestore 기반
  const clientIp = req.ip || 'unknown';
  const rateLimitDocRef = db.collection('rate_limits').doc(clientIp);
  const rateLimitDoc = await rateLimitDocRef.get();
  const now = admin.firestore.Timestamp.now().toMillis();
  const MAX_ATTEMPTS = 3;
  const BLOCK_DURATION_MS = 5 * 60 * 1000; // 5분
  if (rateLimitDoc.exists) {
    const { attempts, lastAttemptTime, blockedUntil } = rateLimitDoc.data() as any;
    if (blockedUntil && blockedUntil > now) {
      res.status(429).json({ success: false, message: '너무 많은 로그인 시도 실패로 인해 잠시 차단되었습니다.' });
      return;
    }
    if (attempts >= MAX_ATTEMPTS && (now - lastAttemptTime) < BLOCK_DURATION_MS) {
      await rateLimitDocRef.set({
        attempts: attempts + 1,
        lastAttemptTime: now,
        blockedUntil: now + BLOCK_DURATION_MS,
      });
      res.status(429).json({ success: false, message: '너무 많은 로그인 시도 실패로 인해 잠시 차단되었습니다.' });
      return;
    } else if ((now - lastAttemptTime) >= BLOCK_DURATION_MS) {
      // 블록 기간이 지났거나, 마지막 시도 후 충분한 시간이 지났으면 초기화
      await rateLimitDocRef.set({ attempts: 1, lastAttemptTime: now, blockedUntil: null });
    } else {
      await rateLimitDocRef.set({ attempts: attempts + 1, lastAttemptTime: now }, { merge: true });
    }
  } else {
    await rateLimitDocRef.set({ attempts: 1, lastAttemptTime: now, blockedUntil: null });
  }
  try {
    // 3. Firestore에서 닉네임으로 사용자 정보 조회
    const usersRef = db.collection('users');
    const q = usersRef.where('nickname', '==', nickname).limit(1);
    const snapshot = await q.get();
    if (snapshot.empty) {
      // 실패 시도 기록 (존재하지 않는 닉네임)
      await rateLimitDocRef.set({ attempts: (rateLimitDoc.data()?.attempts || 0) + 1, lastAttemptTime: now }, { merge: true });
      res.status(404).json({ success: false, message: '존재하지 않는 닉네임입니다.' });
      return;
    }
    const userData = snapshot.docs[0].data();
    const uid = userData.uid;
    const hashedPassword = userData.hashedPassword;
    // 4. 비밀번호 비교
    const passwordMatch = await bcrypt.compare(password, hashedPassword);
    if (!passwordMatch) {
      // 실패 시도 기록 (비밀번호 불일치)
      await rateLimitDocRef.set({ attempts: (rateLimitDoc.data()?.attempts || 0) + 1, lastAttemptTime: now }, { merge: true });
      res.status(401).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
      return;
    }
    // 5. 로그인 성공 시도 횟수 초기화
    await rateLimitDocRef.set({ attempts: 0, lastAttemptTime: now, blockedUntil: null });
    // 6. 커스텀 인증 토큰 발행
    const customToken = await auth.createCustomToken(uid);
    // 7. 로그인 로그 기록
    await db.collection('login_logs').add({
      uid: uid,
      nickname: nickname,
      loginTime: admin.firestore.FieldValue.serverTimestamp(),
      ipAddress: clientIp,
    });
    res.status(200).json({ success: true, customToken: customToken });
  } catch (error: any) {
    console.error('로그인 오류:', error);
    // 이미 응답이 전송되었을 수 있으므로, 헤더 전송 여부 확인
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message || '로그인 중 오류가 발생했습니다.' });
    }
  }
});
