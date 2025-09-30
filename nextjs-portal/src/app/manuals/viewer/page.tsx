'use client';

import { useSearchParams } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import SimplePdfViewer from '@/components/SimplePdfViewer';
// Note: Switched to browser-native PDF viewing via iframe (SimplePdfViewer)

export default function PdfViewerPage() {
  const params = useSearchParams();
  const src = params.get('src') ?? undefined;
  const fullscreen = params.get('fullscreen') === '1' || params.get('fs') === '1';

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-surface text-ink flex">
        <main className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center justify-between p-2 border-b border-border bg-elev">
            <div className="text-sm">PDF 열람</div>
            <a href="/manuals" className="btn">닫기</a>
          </div>
          <div className="flex-1 min-h-0">
            {src ? (
              <SimplePdfViewer initialSrc={src} fill />
            ) : (
              <div className="p-4 text-muted">문서 경로가 없습니다.</div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <PageLayout
      title="PDF 뷰어"
      description="로컬 파일 또는 URL로 PDF를 열어 확인할 수 있습니다."
    >
      <SimplePdfViewer initialSrc={src} />
      <div className="mt-4 text-sm text-muted">
        힌트: 특정 문서를 바로 열려면 URL에 <code>?src=&lt;PDF_URL&gt;</code> 쿼리를 추가하세요.
      </div>
    </PageLayout>
  );
}
