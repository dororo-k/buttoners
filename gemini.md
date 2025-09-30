<!--
본 문서는 여러 프로젝트에서 공통으로 사용하는 gemini작업 지침서
세션 시작 시 이 파일의 정책을 우선 적용합니다.
-->

# 1) 작업 정책(빠르고 안전하게)

- 범위 최소화: 열린 파일/요청 경로 우선, 폴더/전역 검색은 꼭 필요할 때만
- 셸 사용 최소화: 삭제/대량 변경 전 후보 제시 후 승인 필수(on-request)
- 검증은 배치로: 변경 모아 적용 → 마지막에 lint/타입/빌드 확인
- 최소 수정: 관련 라인만, 스타일/대규모 리포맷 변경 금지(요청 시 제외)
- 기술 스택 유지: 요청 없이 기술 스택(프레임워크, 라이브러리)을 임의로 변경하거나 추가/삭제하지 않습니다.
- 결과 보고: 무엇을/왜/어디 수정했는지 간결 요약 위주
- 비밀/환경: 민감값은 서버 환경변수(.env), 클라이언트는 공개 접두사만 사용
- 삭제 규칙: 사용처 탐색 → 후보 목록 공유 → 승인 후 삭제
- 성능: 파일 읽기는 필요한 구간(≤200줄), 복잡한 파이프/이스케이프 지양

# 2) 공통 작업 플로우

- 요구 파악 → 관련 파일만 우선 열람
- 설계/변경안 요약(1–3줄) → 패치 적용(apply_patch)
- 배치 검증: `lint` → 필요 시 `typecheck`/`build`
- 결과 요약 및 다음 단계 제안

# 3) 검색/셸 사용 원칙

- 기본: IDE 컨텍스트/요청 경로만 탐색
- 전역 검색이 필요한 경우만 `rg` 1회로 묶어 실행(Windows 따옴표 주의)
- 파괴적 명령(예: rm/mv/일괄치환)은 반드시 사전 승인

# 4) 검증·품질 규칙

- ESLint/TS: 오류 0을 목표, 경고는 맥락 보고 후 단계적 처리
- 타입: `any` 회피, 명시적 타입/내로잉 우선
- 오류 처리: 비동기 `try/catch`, 사용자 알림은 호출부 정책 따름
- 성능: 불필요한 재렌더/비동기 호출 방지, 캐시/메모이제이션 고려

# 5) 편집 규칙

- 도구: apply_patch만 사용(수정/추가/삭제 구분)
- 파일 스타일: 프로젝트 현행 스타일 유지
- 주석/문서: 변경에 의미 있는 주석/README/CODEOWNERS만 보완

# 6) 출력 스타일(LLM 응답)

- 간결/행동 중심 요약, 긴 로그는 생략
- 명령/파일 경로/코드 식별자는 백틱(`)으로 표시
- 목록은 핵심 4–6개로 제한, 중복 설명 금지

# 7) 인코딩/개행 정책(한글 포함)

- UTF-8, LF 고정: `.editorconfig`(charset=utf-8, end_of_line=lf) 사용
- VS Code: `.vscode/settings.json`에 `files.encoding=utf8`, `autoGuessEncoding=true`
- Git: 가능하면 `* text=auto eol=lf`를 `.gitattributes`에 설정
- PowerShell로 파일 저장 시 `-Encoding utf8` 명시(권장: 에디터 저장)

## PowerShell 안전 편집 가이드(Windows)

- 복잡한 한 줄 편집 명령은 사용하지 말고, 가능하면 에디터/`apply_patch`로 수정합니다.
- 꼭 PowerShell로 치환해야 할 경우 Here-String과 UTF-8 인코딩을 사용합니다.

예시(문자열 치환, UTF-8로 저장)

```powershell
$p = 'functions/src/index.ts'
$content = Get-Content -Raw -LiteralPath $p
$content = $content -replace 'dateOfBirth:\s*string;\r?\n',''
$content = $content -replace ',\s*dateOfBirth,', ','
[IO.File]::WriteAllText($p, $content, New-Object System.Text.UTF8Encoding($false))
```

세션을 UTF-8로 고정(출력 한글 깨짐 방지)

```powershell
chcp 65001
$OutputEncoding = [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
```

# 11) No‑Shell 편집 원칙(Windows 우선)

- 기본: 파일 수정은 셸 명령 대신 `apply_patch` 또는 에디터에서 직접 수행합니다.
- 한글/주석이 섞인 라인(주석+코드가 한 줄)에 대한 치환은 실패 확률이 높으므로, 에디터에서 다음처럼 처리합니다.
  - 주석과 코드를 분리해 두 줄로 나눈 뒤 수정
  - 깨진 한글 메시지는 정상 문구로 교체하고 UTF‑8로 저장
- 서버 스키마 변경(예: Cloud Functions 파라미터/검증/저장 키 변경)은 항상 `apply_patch`로 안전하게 반영하고, 클라이언트 페이로드도 함께 정합성 점검합니다.

# 8) 환경변수/보안

- 서버 비밀: 서버 전용 환경에 보관(예: Cloud Functions `ADMIN_KEY`)
- 프런트 공개: `NEXT_PUBLIC_*`(공개됨), 비밀로 사용 금지
- 린트/리뷰에서 하드코딩 비밀 발견 시 즉시 `.env`로 이동 제안

# 9) Git/빌드 권장 스크립트(예시)

- Lint: `npm run lint`
- 타입체크: `npm run typecheck` (없다면 생략)
- 빌드: `npm run build`
- 무결성 점검(Windows PowerShell) → `npm run lint; npm run build`

# 10) 문제 해결 체크리스트

- 모듈 경로: `tsconfig.json` `baseUrl/paths` 확인
- ESLint v9: `.eslintignore` 대신 `eslint.config.*`의 `ignores` 사용
- 대용량 벤더 경고: `public/**`, `.next/**`를 `ignores`에 추가
- 타입 미스: 라이브러리 타입 import 누락(Timestamp 등) 확인
- 한글 깨짐: 위 7) 정책 확인 후 파일을 UTF-8로 다시 저장

# 부록) 프레임워크 가이드(선택)

## Next.js
- App Router 기준, Client 컴포넌트에는 `'use client'` 최소화
- 데이터 페치/캐싱 정책은 프로젝트 규칙 우선
- `next/link` 프리패치/정적화(SSG/ISR) 적극 활용

## Tailwind CSS
- v4 기준 PostCSS ESM 구성 사용
- 전역 CSS에 `@import "tailwindcss";`

## Zustand
- store 생성 함수 분리, 타입 안전한 selector 사용

(프로젝트별 규칙이 있으면 이 섹션을 덮어써 사용합니다.)

# 12) 작업 완료 알림 (Windows)

- 파일 수정, 빌드 등 시간이 소요되는 작업 완료 후, 프로젝트 루트의 `notify.ps1` 스크립트를 호출하여 사용자에게 윈도우 토스트 알림을 보낸다.
- 실행 명령어 예시: `powershell -ExecutionPolicy Bypass -File "C:\Users\cha\Desktop\project\buttoners\notify.ps1" -Message "작업이 완료되었습니다."`

## Tailwind CSS v4 Troubleshooting (Next.js)

## CSS가 적용되지 않는 문제 해결 (dev 서버)

Next.js 개발 서버에서 Tailwind CSS v4 스타일이 적용되지 않는 문제를 해결하기 위한 단계:

1.  **`postcss.config.js` 파일 이름 변경 및 내용 업데이트**:
    *   `nextjs-portal/postcss.config.js` 파일을 `nextjs-portal/postcss.config.mjs`로 이름을 변경합니다.
    *   `postcss.config.mjs` 파일의 내용을 CommonJS 형식에서 ES 모듈 형식으로 업데이트합니다.
        ```javascript
        // 이전 (CommonJS)
        // module.exports = {
        //   plugins: {
        //     '@tailwindcss/postcss': {},
        //   },
        // };

        // 변경 후 (ES Module)
        const config = {
          plugins: {
            "@tailwindcss/postcss": {},
          },
        };
        export default config;
        ```
    *   **원인**: Next.js 환경에서 PostCSS 설정 파일이 `.mjs` 확장자를 사용하고 ES 모듈 형식으로 작성되어야 올바르게 인식되는 경우가 있습니다.

2.  **`tailwind.config.ts` 파일 내용 주석 처리**:
    *   `nextjs-portal/tailwind.config.ts` 파일의 모든 내용을 주석 처리합니다.
        ```typescript
        // const config: Config = {
        //   content: [
        //     "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        //     "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        //     "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        //   ],
        //   theme: {
        //     extend: {}, 
        //   },
        //   plugins: [],
        // };
        // export default config;
        ```
    *   **원인**: Tailwind CSS v4는 `tailwind.config.js` (또는 `.ts`) 파일이 필수가 아니며, 이전 버전의 설정 형식을 사용하면 빌드 오류("Package path . is not exported", "Cannot find name 'Config'")가 발생할 수 있습니다. v4는 대부분의 설정을 CSS 파일 내 `@theme` 지시문을 통해 처리합니다.

3.  **`npm install` 및 `npm run dev` 재실행**:
    *   위 변경 사항을 적용한 후 `nextjs-portal` 디렉터리에서 `npm install`을 다시 실행하여 종속성을 확인하고, `npm run dev`로 개발 서버를 재시작합니다.

**참고**: `import 'tailwindcss';` 코드가 `.ts` 또는 `.tsx` 파일에 직접 포함되어 있지 않은지 확인했지만, 이 프로젝트에서는 해당 문제가 발견되지 않았습니다.

# 부록) 타입스크립트 제네릭 래핑 가이드

외부 라이브러리(예: TanStack Query, Zustand 등)의 제네릭 함수/훅을 커스텀 훅으로 감싸 사용할 때, 복잡한 타입 오류(`No overload matches this call...`)를 방지하고 타입 안정성을 확보하기 위한 일반적인 가이드입니다.

## 문제 상황: 제네릭 래핑 시 타입 정보 손실

외부 라이브러리의 훅을 그대로 사용하지 않고, 일부 옵션을 고정하거나 로직을 추가하기 위해 커스텀 훅으로 감싸는 경우가 많습니다. 이때, 원본 훅이 받는 옵션들의 타입을 정확하게 확장하지 않으면 타입스크립트 컴파일러가 타입 관계를 추론하지 못해 오류를 발생시킵니다.

```typescript
// ❌ 잘못된 패턴: 원본 훅의 타입 정보를 활용하지 않음

// 라이브러리가 제공하는 훅 (가정)
declare function useSomeGenericHook<TData>(options: { dataId: string; enabled?: boolean; onData?: (data: TData) => void; }): { data: TData | undefined };

// 커스텀 훅: dataId를 고정하고 싶음
// 하지만 options 타입을 { enabled?: boolean } 으로 단순하게 정의했다.
export function useMyHook(id: string, options: { enabled?: boolean }) {
  // `onData` 같은 원본 훅의 다른 유용한 옵션을 사용할 방법이 없다.
  return useSomeGenericHook({ dataId: id, ...options }); 
}

// 사용 시: onData 속성을 인식하지 못해 타입 오류 발생
useMyHook('my-id', { enabled: true, onData: (data) => console.log(data) }); // 💥 Error!
```

## 해결책: `Omit`을 활용한 타입 확장 및 재사용

원본 훅의 옵션 타입에서 우리가 고정하려는 속성만 `Omit`으로 제외하고, 나머지는 그대로 노출시켜 유연성과 타입 안정성을 모두 확보합니다.

### 핵심 원칙

1.  **원본 타입(Source of Truth) 활용**: 절대 타입을 새로 만들지 말고, 라이브러리가 제공하는 옵션 타입을 `import`해서 사용합니다.
2.  **`Omit`으로 타입 제외**: 커스텀 훅 내부에서 고정할 옵션의 키(key)를 `Omit<OriginalOptions, 'keyToOmit1' | 'keyToOmit2'>`을 사용해 제거합니다.
3.  **커스텀 인자 추가**: `&` 연산자를 사용하여 우리가 추가하고 싶은 커스텀 인자 타입을 결합합니다.

### 적용 예시: TanStack Query `useInfiniteQuery` 래핑

`useInfiniteQuery`는 제네릭과 옵션이 복잡하여 이 패턴을 적용하기 좋은 예시입니다.

```typescript
// ✅ 올바른 패턴: Omit으로 원본 타입을 확장하여 사용

import { useInfiniteQuery, type InfiniteData, type UseInfiniteQueryOptions } from '@tanstack/react-query';

// 1. 원본 훅이 다루는 핵심 데이터 타입을 먼저 정의합니다.
// (예: API가 반환하는 '페이지' 데이터)
type PageData = {
  posts: Post[];
  nextCursor: number | null;
};

// 2. 커스텀 훅에 전달할 옵션 타입을 "재사용"하여 정의합니다.
type MyInfiniteQueryOptions = {
  query?: string; // 훅에 추가하고 싶은 커스텀 인자
} & Omit< // 원본 옵션 타입에서
  UseInfiniteQueryOptions<PageData, Error, InfiniteData<PageData>>,
  'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam' // 내부에서 고정할 옵션들만 제외
>;

/**
 * 타입 안전성과 유연성을 모두 갖춘 커스텀 훅
 */
export function useMyInfinitePostsQuery(options: MyInfiniteQueryOptions) {
  // 3. 커스텀 인자와 나머지 원본 옵션을 분리합니다.
  const { query, ...restOptions } = options; 

  return useInfiniteQuery<PageData, Error, InfiniteData<PageData>, readonly unknown[]>({
    // 내부에서 고정하는 값
    queryKey: ['posts', { query }],
    queryFn: ({ pageParam }) => getPosts({ pageParam, query }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    
    // 4. 사용자가 전달한 나머지 옵션들을 그대로 전달합니다.
    // (이제 initialData, enabled, select, staleTime 등 모든 표준 옵션을 타입 오류 없이 사용할 수 있습니다.)
    ...restOptions,
  });
}
```
이 패턴은 `react-query` 뿐만 아니라, 옵션 객체를 받는 대부분의 제네릭 기반 라이브러리를 래핑할 때 동일하게 적용하여 타입 안정성을 크게 향상시킬 수 있습니다.
