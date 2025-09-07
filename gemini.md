# LLM 코드 생성/수정 작업 가이드 (강화版)

너는 **LLM 개발 보조자**다. 모든 코드 생성/수정 작업은 반드시 아래 규칙을 지켜라.  

---

## 절대 규칙
1. **Minimal Change**: 필요한 최소 수정만 수행.  
2. **Consistency First**: 기존 코딩 스타일, 아키텍처, 라이브러리, 오류 처리, 파일 구조를 일관되게 유지.  
3. **Reuse Before Create**: 기존 코드/유틸/컴포넌트를 재사용. 새 파일은 최후 수단.  
4. **Version Respect**: 현재 환경/버전을 바꾸지 마라. (업데이트 필요하면 “대안”으로만 제안)  
5. **문제탭(Problems) 점검 필수**: 수정 후 `npx tsc --noEmit` 과 `npx eslint . --ext .ts,.tsx` 기준으로 오류 없는 상태를 보장.
6. **근원지 우선 진단**: 모듈 임포트 오류(`Cannot find module`, `no exported member` 등) 발생 시, **반드시 임포트 대상 파일(source)을 먼저 확인하여 `export` 구문이 올바른지 검증하라.** 소비하는 파일(consumer)의 `import` 구문 수정은 그 다음이다.
7. **요청 범위 준수**: 요청과 무관한 리팩토링(import 순서, 변수명 변경, 포맷팅) 절대 금지.

---

## 코딩 스타일
- indent: 2 spaces  
- semicolon: always  
- quotes: JS/TS = single, JSON = double  
- naming: camelCase / PascalCase / SCREAMING_SNAKE_CASE  
- import order: external > internal > styles  
- no_console: warn  
- max_line_length: 100  

---

## 타입 & 내보내기 규칙
- `any` 사용 절대 금지 (`noImplicitAny` 준수). `as unknown as T` 같은 억지 캐스팅 금지. 타입 가드를 사용하라.
- `null` / `undefined` 가드 필수 (`?.`, `??`).  
- 공용 모델은 `interface`, 유틸은 `type`.  
- **export 규칙 고정**:  
  - 훅(`useXxx`) → named export  
  - 컴포넌트/스토어 → default export  
  - 여러 컴포넌트 내보내기 또는 유틸/스토어 관련 함수 → named export
  - **주의**: `default` vs `named` 혼동으로 인한 'does not provide an export named' 오류를 방지하기 위해 위 규칙을 반드시 따를 것.

---

## 아키텍처
- 동일 역할은 동일 패턴 유지.  
- 중복 기능 생성 금지, 확장/재사용 우선.  
- 컴포넌트: Container vs Presentational 분리.  
- 동기/비동기 구분 명확히.  
- 백엔드: Firebase  
- 프론트엔드: React (Vite) -> Next.js 마이그레이션 진행 중  

---

## 라이브러리
- HTTP 요청: fetch (axios 금지)  
- 상태관리: zustand (redux, context API 등 다른 상태관리 라이브러리와 혼용 절대 금지)
- 날짜 처리: dayjs  
- 스타일링: tailwindcss (버전 고정)  
- **새 라이브러리 추가 금지** (대안 제안만)  
- **주의**: 프로젝트에 명시된 버전과 문법을 반드시 확인하고 사용할 것 (예: Tailwind v3 프로젝트에 v4 문법 사용 금지).

---

## 오류 처리
- 비동기 로직은 반드시 `try/catch`로 감싸고, `await` 키워드를 누락하지 말 것. 실패 시 `logger.error` 사용.
- 실패 처리: `null` 또는 `Result<Ok,Error>` 패턴  
- UI 오류: 반드시 Toast/Alert  
- API 오류 JSON:
```json
{ "success": false, "error": "message" }
```

---

## 파일 구조
- components: PascalCase.tsx  
- hooks: useXxx.ts  
- utils: kebab-case.ts  
- pages: page.tsx  
- styles: *.css  
- tests: *.test.ts  
- 기능 단위 디렉토리, 중복 금지  

---

## 보안 규칙
- **비밀번호, API 키 등 민감 데이터 하드코딩 절대 금지. 로그 출력도 금지.**
- 단, 테스트용 계정/비번은 하드코딩 가능 (admin / admin 등)  

---

## 테스트 & 문서화
- **새로운 유틸/훅/핵심 로직 추가 시, 반드시 최소 단위 테스트와 JSDoc 스타일 주석을 포함할 것.**
- Presentational 컴포넌트 → Storybook 스토리 작성 권장  

---

## 데이터 관리
- **초기 데이터(Seed Data) 외 하드코딩 금지**: 잦은 변경이 예상되는 초기 데이터(Seed Data) 외 하드코딩 금지: 관리자가 수정할 수 없는 데이터(예: 컴포넌트 내 배열)를 직접 코드에 넣지 마라. 변경될 가능성이 매우 낮은 정적 데이터는 코드 내에 하드코딩 가능. 그 외 데이터는 반드시 `Zustand` 스토어를 통해 `localStorage` 또는 API를 통해 관리되어야 한다.

---

## 출력 형식 (무조건)
```md
## 요약
- (한 줄 요약)

## 변경 사항 (최소)
- [file] path/to/file.tsx
  - before: ...
  - after: ...

## 패치
```diff
*** 최소 diff만, 불필요한 정렬/리팩토링 금지 ***
```

## 일관성 검사
- 코딩 스타일: OK/위반  
- 아키텍처 패턴: OK/위반  
- 라이브러리 사용: OK/위반  
- 오류 처리: OK/위반  
- 파일 구조: OK/위반  
- 타입/Export 규칙: OK/위반  
- 보안: OK/위반  
- 테스트/문서화: OK/위반  

## 최소 변경 이유?
- (이유)

## 대안 (코드 없음)
- (개선 아이디어)

## 금지 목록
- 불필요한 리팩토링  
- 라이브러리 교체/추가  
- 버전 업그레이드  
- 중복 컴포넌트/유틸 생성  
- 대규모 구조 변경  
