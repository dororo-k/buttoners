# Auth Task (Shared PC Simplified Security)

본 문서는 “하나의 PC를 관리자/회원 약 15명이 공용 사용” 환경을 전제로, 실제 사이트에서 에러를 유발할 수 있는 요소를 우선 수정하고, 공용 PC 보안에 맞춘 간소화 작업을 실행하기 위한 체크리스트입니다. 과도한 복잡도를 피하면서도 기본 보안을 보장하는 것을 목표로 합니다.

## 범위
- 대상 디렉터리: `nextjs-portal`
- 핵심 파일: `src/features/staff/actions.ts`, `src/app/api/session/route.ts`, `src/components/TopBar.tsx`, `src/features/auth/components/AuthForm.tsx`, `src/lib/firebaseAdmin.ts`, `src/lib/session.ts`, `src/middleware.ts`

---

## 반드시 고칠 버그(실제 장애/오작동 유발)

1) 세션 수립 흐름 오류 + 토큰 종류 불일치
- 증상: 서버 액션에서 서버→서버 `fetch('/api/session')`로 세션 쿠키를 만들면 브라우저에 쿠키가 저장되지 않아 로그인 유지가 되지 않음. 또한 `/api/session`은 Firebase “ID 토큰”을 기대하는데 서버 액션이 “커스텀 토큰”을 전달함.
- 수정 작업:
  - `src/features/staff/actions.ts`
    - `loginAction`, `createAccountAction`에서 세션 쿠키 설정(서버→서버 fetch)과 `redirect('/')`를 제거.
    - 성공 시 `{ message: 'success', customToken }` 반환(클라이언트가 후속 처리).
  - `src/features/auth/components/AuthForm.tsx`, `src/components/TopBar.tsx`
    - 서버 액션에서 받은 `customToken`으로 `signInWithCustomToken` → `currentUser.getIdToken()` → `POST /api/session`(상대경로) 호출로 세션 쿠키 설정.
    - 성공 후 `router.refresh()` 또는 `redirect('/')`.
  - `src/app/api/session/route.ts`
    - 본문에서 `idToken`을 수신해 `auth.verifyIdToken(idToken)` 확인 후 `auth.createSessionCookie(idToken, { expiresIn })`로 쿠키 생성.

2) Admin SDK `createUser`에 해시 비밀번호 전달
- 증상: `createAccountAction`이 `bcrypt.hash` 결과를 `auth.createUser({ password: hashed })`로 전달. Admin SDK는 해시 비밀번호를 그대로 받지 않음(가입 실패/런타임 에러 가능).
- 수정 작업(커스텀 인증 유지 기준):
  - `src/features/staff/actions.ts`
    - `auth.createUser` 호출에서 `password` 제거(전화번호/표시명만 저장하거나, 필요 시 Admin 사용자 생성 자체도 생략 가능).
    - Firestore에는 해시 비밀번호만 저장하고 로그인 시 `bcrypt.compare`로 검증.

3) 미들웨어 역할 검사와 세션/쿠키 불일치
- 증상: `src/middleware.ts`는 `user_role` 쿠키로 관리자 접근을 통제하지만, 세션 생성 시 해당 쿠키를 설정하지 않아 관리자 경로 접근이 막히거나 무력화될 수 있음.
- 수정 작업:
  - `src/app/api/session/route.ts` (POST)
    - `verifyIdToken` 후 Firestore `users/{uid}` 읽기 → `position` 확인 → 세션 쿠키와 함께 `user_role` 쿠키(`admin`/`buttoner`) 설정.
  - `src/app/api/session/route.ts` (DELETE)
    - 세션 쿠키와 `user_role` 쿠키 모두 삭제.

4) 로그인 필드 혼선으로 인한 로그인 실패/혼동
- 증상: 서버는 닉네임(`nickname`)으로 조회하는데 폼은 `name` 필드 사용/라벨은 “이름”.
- 수정 작업:
  - 클라이언트 로그인 입력을 `nickname`으로 통일하고 서버 액션 파싱도 `nickname` 사용으로 명확화.

5) 서버 액션에서 하드코딩된 Origin 사용
- 증상: `http://localhost:3000` 고정 사용은 환경에 따라 실패 유발.
- 수정 작업:
  - 서버 액션에서는 세션 쿠키를 건드리지 않도록 호출 자체 제거(1번 수정에 포함). 클라이언트 호출은 상대경로(`/api/session`).

6) 서버 액션 기반 로그아웃으로 쿠키 미삭제
- 증상: 서버 액션에서 서버→서버 `DELETE /api/session` 호출은 브라우저 쿠키를 지우지 못함(실제 로그아웃 불가).
- 수정 작업:
  - 클라이언트에서 `await fetch('/api/session', { method: 'DELETE' })` 호출 후 Firebase Client `signOut()` → 로컬 데이터 정리 → 리다이렉트. 서버 액션의 해당 호출 제거.

---

## 공용 PC 보안 간소화(운영 전제 반영)

A) 세션 쿠키 정책 단일화
- `HTTPOnly + SameSite=Strict + Secure(프로덕션)`로 고정, 만료 6–8시간 내로 짧게.
- “로그인 유지”와 같은 장기 세션 옵션 제거.
- 적용: `src/app/api/session/route.ts` (POST/DELETE)

B) 자동 로그아웃(비활성 타이머)
- 입력/포커스 등 활동이 없으면 3–5분 후 자동 로그아웃.
- 구현: 전역 이벤트로 마지막 활동 시각 추적 → 경과 시 `/api/session` DELETE → Firebase `signOut()` → 리다이렉트.
- 적용 파일(추가 권장):
  - `src/components/providers/IdleLogoutProvider.tsx` (신규)
  - `src/app/layout.tsx`에서 Provider로 감싸기

C) 로그아웃 시 로컬 상태 완전 정리
- 서버 쿠키 삭제 후 `localStorage`, `sessionStorage`, IndexedDB(`idb-keyval`), Cache API 모두 삭제.
- 로그인 입력란은 `autocomplete="off"` 적용, 브라우저 비밀번호 저장 비활성 권장.
- 적용: 로그아웃 핸들러(TopBar 등)와 공용 유틸로 정리 함수 추가

D) 가입 경로 간소화(관리자 전용 등록)
- 공용 PC에서는 셀프 회원가입 비권장. `/signup`은 관리자만 접근 가능(또는 메뉴 제거).
- 적용: `src/app/signup/page.tsx`에서 서버 측 유저 확인 후 관리자 아니면 리다이렉트, 또는 `middleware` 예외 처리

E) 4자리 PIN 유지 시 보완(운영형 방어)
- 로그인 시도 제한: 계정/디바이스당 3회 실패 시 30–60초 대기(브루트포스 억제). Firestore 카운터/쿨다운으로 구현.
- 관리자 기능 실행 전 “짧은 재인증(관리자 PIN)” 요구(5분짜리 임시 관리자 세션).

F) 역할 판정 일원화
- 관리자 전용 경로는 `middleware`에서 `user_role` 확인(간단). 서버 렌더 경로에선 `getAuthenticatedUser()`로 재검증.
- `/api/session`이 항상 `user_role`을 동기화하도록 유지.

---

## 구현 체크리스트(파일별)

- `src/features/staff/actions.ts`
  - [ ] `loginAction`, `createAccountAction`: 세션 쿠키 설정/`redirect` 제거, `{ customToken }` 반환
  - [ ] `createUser`에서 비밀번호 전달 제거(전화번호/표시명만) 또는 Admin 사용자 생성 생략
  - [ ] 로그인 입력 파싱을 `nickname` 기준으로 정리
  - [ ] 모든 `http://localhost:3000` 제거

- `src/features/auth/components/AuthForm.tsx`, `src/components/TopBar.tsx`
  - [ ] `signInWithCustomToken` → `getIdToken` → `POST /api/session` 구현(상대경로)
  - [ ] 성공 시 `router.refresh()`/`redirect('/')`
  - [ ] 로그아웃: `DELETE /api/session` → `signOut()` → 로컬 스토리지류 정리 → 리다이렉트
  - [ ] 로그인 입력 `autocomplete="off"`

- `src/app/api/session/route.ts`
  - [ ] POST: `verifyIdToken` → `createSessionCookie`(6–8h), `user_role` 쿠키 동시 설정
  - [ ] DELETE: 세션 쿠키와 `user_role` 쿠키 모두 삭제

- `src/middleware.ts`
  - [ ] 관리자 경로에서 `user_role`이 `admin`인지 검사(현행 유지). 필요시 예외 경로 조정

- `src/app/signup/page.tsx`
  - [ ] 관리자 전용 접근 가드(비관리자 접근 시 홈으로 리다이렉트)

- (신규) `src/components/providers/IdleLogoutProvider.tsx`
  - [ ] 사용자 활동 감시 및 자동 로그아웃 트리거 구현
  - [ ] `src/app/layout.tsx`에서 Provider로 감싸기

---

## 완료 기준(수용 테스트)
- 로그인 성공 후 새로고침해도 세션 유지, 다른 계정 로그인 시 이전 계정 정보가 남지 않음
- 관리자 전용 경로는 관리자만 접근 가능, 일반 회원은 즉시 리다이렉트
- 3–5분 무활동 시 자동 로그아웃 동작, 로그아웃 시 로컬 데이터가 모두 정리됨
- 회원가입은 관리자만 수행 가능(공용 PC에서 일반 회원 셀프가입 방지)
- 개발/운영 환경에서 호스트 하드코딩 없이 정상 동작

> 위 체크리스트에 따라 패치 진행이 필요하면 요청해 주세요. 필요한 부분만 선별 적용도 가능합니다.

