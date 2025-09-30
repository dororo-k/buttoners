# 인증/계정 관리 리팩토링 계획: 이따위로 할 바엔 차라리 손을 떼라

이 계획은 당신의 로그인 아키텍처가 얼마나 한심한 수준인지 여실히 보여주는 증거다. "리팩토링"이라는 거창한 이름을 붙였지만, 본질적으로는 땜질식 처방에 불과하며, 근본적인 설계 결함을 외면하고 있다.

## 2. 현황 분석: 썩어 문드러진 설계의 민낯

당신이 나열한 파일 목록만 봐도 역겹다. `functions/src/index.ts`? `useStaffSession.ts`? `src/lib/session.ts`? `api/session/route.ts`? `firebaseAdmin.ts`? `firebaseClient.ts`? 이쯤 되면 "인증"이라는 단어 자체가 당신의 무능함을 비웃는 듯하다.

-   **`functions/src/index.ts`**: Cloud Functions에 비밀번호 해싱, 중복 검사, 커스텀 토큰 생성 같은 핵심 로직을 박아 넣었다는 것 자체가 재앙이다. 서버리스 함수는 단일 책임 원칙을 지켜야 하는데, 당신은 여기에 온갖 잡동사니를 쑤셔 넣었다. 이따위로 복잡하게 만들 바엔 차라리 모놀리식 서버를 쓰는 게 낫다.
-   **`useStaffSession.ts`와 `src/lib/session.ts`**: 클라이언트 측 `onAuthStateChanged`와 서버 측 세션 쿠키를 동시에 관리하겠다는 발상 자체가 정신 나간 짓이다. 두 개의 진실의 원천(Source of Truth)을 두면 필연적으로 동기화 문제가 발생하고, 당신은 그 지옥 같은 디버깅에 시달릴 것이다.
-   **`src/app/api/session/route.ts`**: ID 토큰으로 세션 쿠키를 생성하고 삭제하는 API 라우트? 이건 그나마 봐줄 만하지만, 당신의 다른 엉망진창인 로직과 엮이면 결국 혼돈의 일부가 될 뿐이다.

### 2.2. 현재 아키텍처의 치명적인 결함: 자가당착의 극치

당신이 스스로 나열한 문제점들은 당신의 설계가 얼마나 엉망인지 스스로 증명하고 있다.

1.  **로직 분산**: "인증 로직이 Cloud Functions, Next.js API Routes, 클라이언트 훅에 걸쳐 흩어져 있어 전체 흐름을 파악하기 어렵고 유지보수 비용이 높습니다." - 당연한 결과다. 애초에 설계를 이따위로 했으니 로직이 찢어발겨지는 건 필연적이다. 이걸 이제 와서 "문제점"이라고 인식하는 것 자체가 한심하다.
2.  **이중 배포**: "프론트엔드(Next.js)와 백엔드(Cloud Functions)를 별도로 배포해야 하므로 개발 프로세스가 번거롭습니다." - 서버리스의 장점을 걷어차고 단점만 취하는 완벽한 예시다. 당신은 기술 스택을 선택할 자격이 없다.
3.  **상태 동기화의 복잡성**: "클라이언트의 `onAuthStateChanged`와 서버의 세션 쿠키라는 두 가지 인증 상태 소스가 존재하여, 둘 사이의 동기화가 어긋날 경우 예기치 않은 동작이 발생할 수 있습니다." - 이 부분은 특히 역겹다. 두 개의 진실의 원천을 두는 것은 자살 행위나 다름없다. 당신은 스스로 지뢰밭을 만들고 그 위를 걷고 있다.
4.  **보안의 부재**: 비밀번호 해싱을 클라이언트 측에서 처리하거나, 네트워크를 통해 평문으로 전송하는 것은 범죄에 가깝다. 진정한 보안은 서버에서만 이루어져야 한다.
5.  **오류 처리의 미흡함**: 사용자에게 친화적인 오류 메시지, 재시도 로직, 로깅 전략 등이 전무하다. 당신의 코드는 오류 앞에서 무력하다.
6.  **테스트 전략의 부재**: 이 복잡한 리팩토링을 진행하면서 테스트에 대한 언급이 단 한 줄도 없다. 당신은 변경 사항이 제대로 작동하는지, 그리고 새로운 버그를 만들지 않았는지 어떻게 확신할 것인가?

## 3. 리팩토링 실행 계획: 땜질이 아닌 근본적인 수술

당신의 "실행 계획"은 그저 썩은 살을 도려내는 척하는 미봉책에 불과했다. 이제부터는 근본적인 수술을 시작한다. 각 단계는 명확한 목표와 함께 당신의 무능함을 개선할 기회를 제공할 것이다.

### 3.1. 1단계: 핵심 서버 측 인증 로직 통합 (기반 다지기)

-   [x] **3.1.1. `bcryptjs` 의존성 추가**:
    -   [x] `nextjs-portal/package.json`의 `dependencies`에 `bcryptjs`를 추가한다.
    -   [x] `npm install` 또는 `yarn install`을 실행하여 종속성을 설치한다.
-   [x] **3.1.2. `/api/session` 역할 강화 및 유지**:
    -   [x] `src/app/api/session/route.ts` 파일이 Firebase ID 토큰을 받아 세션 쿠키를 생성하고, 로그아웃 시 세션 쿠키를 삭제하는 유일한 역할을 수행하도록 한다.
    -   [x] 이 API는 서버 액션 내부에서만 호출되도록 보안을 강화한다.
-   [x] **3.1.3. `src/features/staff/actions.ts` 파일 생성 및 `createAccountAction` 마이그레이션**:
    -   [x] `src/features/staff/actions.ts` 파일을 생성하고, 파일 최상단에 `'use server'` 지시어를 명시한다.
    -   [x] `functions/src/index.ts`의 `createAccount` 함수 로직을 `createAccountAction`이라는 새로운 서버 액션으로 이전한다.
    -   [x] 이 서버 액션은 `firebase-admin`을 사용하여 사용자 계정을 생성하고 Firestore에 사용자 문서를 저장한다.
    -   [x] **보안 강화**: 비밀번호는 클라이언트에서 해싱하지 않고, HTTPS를 통해 평문으로 전송받아 `createAccountAction` 내부에서 `bcryptjs`를 사용하여 강력하게 해싱하고 저장한다.
    -   [x] 성공 시, `/api/session` API를 내부적으로 호출하여 세션 쿠키를 설정하고 `redirect('/')`를 통해 사용자를 메인 페이지로 리디렉션한다.
-   [x] **3.1.4. `loginUser` 마이그레이션**:
    -   [x] `functions/src/index.ts`의 `loginUser` 함수 로직을 `src/features/staff/actions.ts`에 `loginAction` 서버 액션으로 이전한다.
    -   [x] 사용자 조회 및 `bcryptjs`를 사용한 비밀번호 검증 로직을 포함한다.
    -   [x] 성공 시, `/api/session` API를 내부적으로 호출하여 세션 쿠키를 설정하고 `redirect('/')`를 통해 사용자를 메인 페이지로 리디렉션한다.
-   [x] **3.1.5. 중앙 집중식 오류 처리 구현**:
    -   [x] `src/features/staff/actions.ts` 내 모든 서버 액션에 대해 일관된 오류 처리 로직을 적용한다.
    -   [x] 사용자에게는 모호한 "요청 실패" 대신 구체적이고 이해하기 쉬운 오류 메시지를 반환하고, 서버 로그에는 상세한 스택 트레이스와 컨텍스트 정보를 기록한다.

### 3.2. 2단계: 클라이언트 측 통합 및 역할 재정의 (1단계 의존)

-   [x] **3.2.1. `useStaffAuthForm` 리팩토링**:
    -   [x] `src/features/staff/hooks/useStaffAuthForm.ts` 파일을 수정하여 회원가입 및 로그인 폼이 Cloud Functions URL 대신 새로 만든 서버 액션(`createAccountAction`, `loginAction`)을 직접 호출하도록 한다.
    -   [x] `react-dom`의 `useFormState` 훅을 활용하여 서버 액션의 결과(성공/실패 메시지)를 폼에 직접 바인딩한다.
    -   [x] 클라이언트 측에서 비밀번호를 해싱하는 로직이 있다면 즉시 제거한다.
-   [x] **3.2.2. `useStaffSession` 역할 축소**:
    -   [x] `src/features/staff/hooks/useStaffSession.ts` 파일에서 `onAuthStateChanged` 리스너를 완전히 제거한다.
    -   [x] `login`, `register`, `logout` 함수를 제거하고, 대신 서버 액션을 직접 사용하도록 변경한다.
    -   [x] `currentUser` 상태는 페이지 로드 시 서버 컴포넌트에서 전달받은 초기값을 사용하고, 인증 상태 변경이 필요할 때는 `router.refresh()`를 통해 서버로부터 최신 세션 정보를 다시 받아와 UI를 갱신하도록 한다.
-   [x] **3.2.3. UI 컴포넌트 업데이트**:
    -   [x] `src/app/signup/page.tsx` 및 `src/app/login/page.tsx`가 `useStaffAuthForm` 훅을 통해 새로운 서버 액션을 호출하도록 수정한다.
    -   [x] `src/components/TopBar.tsx`의 로그아웃 기능이 새로운 로그아웃 서버 액션을 호출하도록 수정한다.

### 3.3. 3단계: 세션 관리 일원화 및 최종 정리 (2단계 의존)

-   [x] **3.3.1. 서버 컴포넌트 중심 세션 관리 강제**:
    -   [x] `src/lib/session.ts`의 `getAuthenticatedUser`를 유일한 "신뢰할 수 있는 출처(Source of Truth)"로 삼는다. 모든 페이지와 컴포넌트는 이 함수를 통해 서버에서 검증된 사용자 정보를 얻는다.
    -   [x] 클라이언트 측에서 Firebase Auth SDK를 통해 사용자 인증 상태를 직접 구독하는 모든 코드를 제거한다.
-   [ ] **3.3.2. 포괄적인 테스트 전략 수립 및 실행**:
    -   [ ] **단위 테스트**: `src/features/staff/actions.ts`의 `createAccountAction`, `loginAction` 등 핵심 서버 액션에 대한 단위 테스트를 작성한다. (Jest, Vitest 등)
    -   [ ] **통합 테스트**: `useStaffAuthForm`과 서버 액션 간의 연동, 세션 쿠키 설정/삭제 등 인증 흐름 전반에 대한 통합 테스트를 작성한다. (React Testing Library, Playwright 등)
    -   [ ] **E2E 테스트**: 실제 브라우저 환경에서 회원가입, 로그인, 로그아웃 시나리오를 검증하는 E2E 테스트를 작성한다. (Playwright, Cypress 등)
-   [x] **3.3.3. 불필요한 Cloud Functions 제거**:
    -   [x] `functions` 디렉토리에서 `createAccount` 및 `loginUser` 관련 Cloud Functions 코드를 완전히 삭제한다.
    -   [x] `functions` 디렉토리의 `package.json`에서 `bcryptjs` 등 더 이상 사용하지 않는 종속성을 제거한다.
    -   [x] Cloud Functions 배포 스크립트 및 관련 설정 파일을 정리한다.

## 4. 기술적 고려사항: 뻔한 문제, 뻔한 해결책 (하지만 이번엔 제대로)

당신이 나열한 기술적 고려사항들은 이미 수많은 개발자들이 겪고 해결한 뻔한 문제들이다. 하지만 이번에는 제대로 처리해야 한다.

-   **`'use server'`와 `'use client'` 경계**:
    -   서버 액션 파일은 반드시 최상단에 `'use server'`를 명시하여 서버 전용 번들로 처리되도록 한다.
    -   클라이언트 컴포넌트에서는 서버 액션 함수 자체만 `import`하고, `firebase-admin`과 같은 서버 전용 라이브러리를 직접 `import`하지 않도록 철저히 관리한다.
-   **환경 변수 관리**:
    -   `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` 등 민감한 정보는 `NEXT_PUBLIC_` 접두사 없이 `.env.local`에 저장하고, Vercel 등 배포 환경의 Environment Variables에 동일하게 설정한다.
    -   클라이언트 측에서 필요한 Firebase 설정(`NEXT_PUBLIC_FIREBASE_API_KEY` 등)만 `NEXT_PUBLIC_` 접두사를 사용한다.
-   **종속성 관리**:
    -   `bcryptjs`는 `nextjs-portal/package.json`의 `dependencies`에 추가하고, `functions` 디렉토리의 `package.json`에서는 제거한다.
-   **보안 모범 사례**:
    -   모든 인증 관련 통신은 HTTPS를 통해 이루어지도록 한다.
    -   비밀번호는 클라이언트에서 해싱하지 않고, 서버 액션 내부에서 안전하게 해싱한다.
    -   세션 쿠키는 `HttpOnly`, `Secure`, `SameSite=Lax` 속성을 사용하여 보안을 강화한다.
-   **오류 처리 패턴**:
    -   `try-catch` 블록을 사용하여 모든 비동기 작업의 오류를 명시적으로 처리한다.
    -   사용자에게는 일반적인 오류 메시지를, 개발자에게는 상세한 디버깅 정보를 제공한다.
    -   `Sentry`와 같은 오류 모니터링 도구를 통합하여 프로덕션 환경의 오류를 추적한다.
-   **테스트 프레임워크 및 전략**:
    -   Jest 또는 Vitest를 사용하여 단위 테스트를 작성한다.
    -   React Testing Library를 사용하여 클라이언트 컴포넌트의 동작을 테스트한다.
    -   Playwright 또는 Cypress를 사용하여 E2E 테스트를 작성하여 전체 인증 흐름을 검증한다.

---

이것이 당신의 한심한 아키텍처에 대한 나의 잔인한 비평이자, 당신의 프로젝트를 구원할 유일한 길이다. 명심해라.