# PDF 뷰어 웹페이지 개발 매뉴얼

본 문서는 Next.js(앱 라우터) 기반 포털 내에서 PDF를 열람하는 두 가지 구현 방식을 안내합니다.

1) 간단형: 브라우저 기본 PDF 뷰어(iframe) 활용 — 구현이 가장 간단, 대부분의 브라우저에서 즉시 동작
2) 고급형: pdf.js 라이브러리 직접 사용 — 페이지 썸네일, 텍스트 선택/검색, 맞춤 UI 등 고급 기능

---

## 사전 준비

- Next.js 14+ (본 프로젝트 `nextjs-portal`)
- PDF 정적 파일은 `nextjs-portal/public` 디렉터리에 배치 가능 (예: `public/sample.pdf`)
- 원격 PDF(다른 도메인) 로드 시 CORS 허용 필요

프로젝트에는 이미 pdf.js 리소스 일부가 포함되어 있습니다:

- 워커: `public/pdf.worker.min.mjs` (pdf.js v5.4.149)
- CMaps/폰트: `public/pdfjs/` 하위 (`cmaps`, `standard_fonts`)

---

## A. 간단형(iframe) 뷰어 — 현재 구현됨

브라우저 내장 PDF 뷰어를 활용합니다. 구현/유지보수가 매우 간단하고, 기본적인 줌/페이지 이동/인쇄/다운로드 기능을 제공합니다(브라우저 제공 범위 내).

구성 파일:

- 페이지: `src/app/manuals/viewer/page.tsx`
- 컴포넌트: `src/components/SimplePdfViewer.tsx`

사용 방법:

- 특정 PDF 파일을 열기: `/manuals/viewer?src=/sample.pdf`
  - 로컬 프로젝트에 `public/sample.pdf`를 추가하면 위 경로로 접근 가능
- UI에서 파일 선택(로컬) 또는 URL 입력으로 열람 가능

장점/제약:

- 장점: 구현 간단, 빠름, 브라우저 호환성 우수
- 제약: 세밀한 렌더링 제어/주석/텍스트 추출 등 고급 기능은 제한적

---

## B. 고급형(pdf.js) 뷰어 — 추후 확장 가이드

pdf.js를 직접 사용하면 페이지 렌더링, 텍스트 레이어, 탐색/썸네일, 주석 등 고급 기능을 구현할 수 있습니다.

1) 설치(선택):

```bash
npm i pdfjs-dist
```

2) 워커/리소스 경로 설정:

- 워커: `pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'`
- CMap: `cMapUrl: '/pdfjs/cmaps/', cMapPacked: true`
- 표준 폰트: `standardFontDataUrl: '/pdfjs/standard_fonts/'`

3) 기본 로딩/렌더링 예시(개요):

```ts
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import { EventBus, PDFLinkService, PDFViewer } from 'pdfjs-dist/web/pdf_viewer.mjs';
// import 'pdfjs-dist/web/pdf_viewer.css'; // 필요 시 CSS 적용

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const loadingTask = pdfjsLib.getDocument({
  url: '/sample.pdf',
  cMapUrl: '/pdfjs/cmaps/',
  cMapPacked: true,
  standardFontDataUrl: '/pdfjs/standard_fonts/',
});

const eventBus = new EventBus();
const linkService = new PDFLinkService({ eventBus });
const viewer = new PDFViewer({
  container: document.getElementById('viewerContainer')!,
  eventBus,
  linkService,
});
linkService.setViewer(viewer);

loadingTask.promise.then(pdfDocument => {
  viewer.setDocument(pdfDocument);
  linkService.setDocument(pdfDocument);
});
```

4) Next.js(App Router) 주의사항:

- 클라이언트 컴포넌트에서 동적 import 또는 `useEffect` 내 로직으로 초기화
- 서버 렌더링 시 DOM 접근 금지; `'use client'` 사용
- CSS(`pdf_viewer.css`)는 전역 또는 컴포넌트 범위로 불러오기

---

## CORS/보안 주의사항

- 다른 도메인의 PDF를 불러올 때는 해당 서버가 `Access-Control-Allow-Origin`을 적절히 설정해야 합니다.
- 사내/내부 문서의 경우 인증/권한 제어를 먼저 고려하세요.

---

## 문제 해결 가이드

- PDF가 로드되지 않음: 경로 확인(`/public`에 두면 루트(`/`) 기준), CORS 응답 헤더 점검
- 모바일에서 확대/축소 문제: 내장 뷰어 동작은 브라우저마다 차이 존재 → 필요 시 pdf.js 고급형으로 전환
- 한글 폰트 깨짐: pdf.js 사용 시 CMap/standard font 경로 설정 확인

---

## 빠른 시작(추천)

1) `public`에 테스트 파일 배치(예: `public/sample.pdf`)
2) 브라우저에서 `/manuals/viewer?src=/sample.pdf` 접속
3) 필요 기능에 따라 간단형 유지 또는 고급형(pdf.js)로 확장

