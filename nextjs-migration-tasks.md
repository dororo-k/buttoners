# Next.js 마이그레이션 작업 목록

## 1단계: 기반 구축 (Foundation)
- [x] 글로벌 스타일 및 폰트 적용 (`globals.css`, `tailwind.config.js`)
- [x] 핵심 레이아웃 마이그레이션 (`Sidebar`, `TopBar` -> `app/layout.tsx`)
- [x] 공용 타입 및 유틸리티 이전 (`types.ts`, `utils/*`)

## 2단계: 핵심 로직 이식 (Core Logic Porting)
- [x] Zustand 스토어 및 Provider 마이그레이션
- [x] 인증 시스템 재구축 (Next.js Middleware 활용)

## 3단계: 페이지 및 기능 마이그레이션 (The Bulk Work)
- [x] `MainPage.tsx`
- [x] `NoticesPage.tsx`
- [x] `BoardPage.tsx`
- [x] `ManualsPage.tsx`
- [x] `CleaningPage.tsx`
- [x] `GamePage.tsx`
- [x] `PointsPage.tsx`
- [x] `SchedulePage.tsx`
- [x] `SettingsPage.tsx`
 
## 4단계: 오류 수정 및 최종화 (Error Fixing & Finalization)

### 4.1. ESLint 경고 수정
- [ ] **`@typescript-eslint/no-unused-vars`**: 사용하지 않는 변수/인자 제거
  - [ ] `ManualCard.tsx`, `Backup.tsx`, `Restore.tsx`, `LoginWidget.tsx`, `useStaffStore.ts` 등
- [ ] **`@typescript-eslint/no-unused-expressions`**: `&&` 연산자를 사용한 조건부 실행을 `if`문으로 변경
  - [ ] `CleaningTaskList.tsx`, `StaffLoginForm.tsx`
- [ ] **`@typescript-eslint/no-explicit-any`**: `any` 타입을 구체적인 타입 또는 `unknown`으로 변경
  - [ ] `PdfjsViewer.tsx`, `Backup.tsx`, `useBoardStore.ts`
- [ ] **`react-hooks/exhaustive-deps`**: `useEffect` 클린업 함수 내 `ref` 참조 방식 수정
  - [ ] `ThumbnailRail.tsx`, `ThumbnailItem.tsx`

### 4.2. TypeScript 컴파일 오류 수정
- [ ] **TS2345/TS2552 등**: `null` 가능성이 있는 변수 타입 가드 추가 및 `catch` 블록 변수 스코프 오류 수정
  - [ ] `PdfjsViewer.tsx`, `ManualCard.tsx`, `Restore.tsx`
- [ ] **Parsing Error**: 중괄호 불일치 등 구문 오류 수정
  - [ ] `StaffLoginForm.tsx`

### 4.3. Next.js 빌드 경고 수정
- [ ] **Workspace Root**: 중복된 `package-lock.json` 파일 정리
- [ ] **PostCSS Config**: `postcss.config.js`의 모듈 타입 명시

## 5단계: 최종 검증 (Final Verification)
- [ ] 중복 컴포넌트 경로 정리 (`src/components/features` vs `src/features`)
- [ ] 전체 라우팅 및 네비게이션 링크 검증
- [ ] 모든 기능 상호작용 테스트 (로그인, CRUD 등)
- [ ] 최종 프로덕션 빌드 테스트 (`npm run build`)