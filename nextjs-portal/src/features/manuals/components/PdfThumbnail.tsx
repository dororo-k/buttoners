"use client";

import { useMemo } from 'react';

type Props = {
  url: string;
  width?: number; // 유지: 향후 스타일 적용용
  className?: string;
};

// 브라우저 기본(사전 생성된 이미지) 기반 썸네일 컴포넌트
// - pdf.js 의존성 제거
// - 규칙: PDF URL이 .pdf로 끝나면 같은 경로의 .png를 썸네일로 시도
// - 없으면 공통 플레이스홀더 이미지를 사용
export default function PdfThumbnail({ url, className }: Props) {
  const derivedThumb = useMemo(() => {
    try {
      // window 환경에서만 절대 URL 계산. 서버/빌드 시에는 실패해도 안전.
      const u = typeof window !== 'undefined' ? new URL(url, window.location.origin) : null;
      if (!u) return null;
      const lower = u.pathname.toLowerCase();
      if (lower.endsWith('.pdf')) {
        u.pathname = u.pathname.slice(0, -4) + '.png';
        return u.toString();
      }
      return null;
    } catch {
      return null;
    }
  }, [url]);

  const src = derivedThumb || '/images/pdf-generic-thumb.png';

  return (
    <img
      src={src}
      alt="PDF 썸네일"
      className={`h-full w-full object-contain p-2 ${className ?? ''}`}
      loading="lazy"
    />
  );
}
