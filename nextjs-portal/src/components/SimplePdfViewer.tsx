'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  initialSrc?: string;
  className?: string;
  fill?: boolean; // if true, viewer fills container height
};

export default function SimplePdfViewer({ initialSrc, className, fill = false }: Props) {
  const [src, setSrc] = useState<string | undefined>(initialSrc);
  const [objectUrl, setObjectUrl] = useState<string | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [zoom, setZoom] = useState<string>('page-fit');

  const displaySrc = useMemo(() => objectUrl ?? src, [objectUrl, src]);

  const ZOOM_PRESETS: Array<string> = ['page-fit', 'page-width', '50', '75', '100', '125', '150', '200', '300'];

  const clampZoomIndex = (idx: number) => {
    if (idx < 0) return 0;
    if (idx >= ZOOM_PRESETS.length) return ZOOM_PRESETS.length - 1;
    return idx;
  };

  const currentZoomIndex = useMemo(() => {
    const i = ZOOM_PRESETS.indexOf(zoom);
    return i === -1 ? ZOOM_PRESETS.indexOf('100') : i;
  }, [zoom]);

  const stepZoom = (dir: -1 | 1) => {
    const i = currentZoomIndex;
    // If not numeric preset (e.g., page-fit), start from 100 on step
    const startIndex = i === -1 || ['page-fit', 'page-width'].includes(zoom) ? ZOOM_PRESETS.indexOf('100') : i;
    const next = clampZoomIndex(startIndex + dir);
    setZoom(ZOOM_PRESETS[next]);
  };

  function buildPdfSrc(base: string | undefined): string | undefined {
    if (!base) return undefined;
    const [pure, hash = ''] = base.split('#');
    const params = new URLSearchParams(hash.replace(/&/g, '&'));
    if (!params.get('page')) params.set('page', '1');
    params.set('zoom', zoom);
    const newHash = params.toString().replace(/%26/g, '&');
    return `${pure}#${newHash}`;
  }

  const viewerSrc = useMemo(() => buildPdfSrc(displaySrc), [displaySrc, zoom]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    // Revoke old URL to avoid leaks
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setObjectUrl(url);
    setSrc(undefined);
  }, [objectUrl]);

  const handleUrlSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = new FormData(form).get('pdfUrl');
    if (typeof input === 'string' && input.trim()) {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setObjectUrl(undefined);
      setSrc(input.trim());
    }
  }, [objectUrl]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsNativeFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  return (
    <div className={className} ref={containerRef}>
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium">로컬 PDF 선택</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="border rounded px-2 py-1"
          />
        </div>

        <form className="flex flex-wrap items-center gap-2" onSubmit={handleUrlSubmit}>
          <label htmlFor="pdfUrl" className="text-sm font-medium">또는 URL 입력</label>
          <input
            id="pdfUrl"
            name="pdfUrl"
            type="url"
            placeholder="https://example.com/file.pdf"
            defaultValue={initialSrc}
            className="border rounded px-2 py-1 min-w-[280px] flex-1"
          />
          <button type="submit" className="btn">불러오기</button>
          <button type="button" className="btn" onClick={toggleFullscreen} aria-label="전체화면">
            {isNativeFullscreen ? '전체화면 종료' : '전체화면'}
          </button>
          <div className="flex items-center gap-1 ml-auto">
            <button type="button" className="btn" onClick={() => stepZoom(-1)} aria-label="축소">-</button>
            <select
              value={zoom}
              onChange={(e) => setZoom(e.target.value)}
              className="border rounded px-2 py-1"
              aria-label="확대/축소 비율"
            >
              {ZOOM_PRESETS.map((z) => (
                <option key={z} value={z}>
                  {z === 'page-fit' ? '맞춤' : z === 'page-width' ? '너비맞춤' : `${z}%`}
                </option>
              ))}
            </select>
            <button type="button" className="btn" onClick={() => stepZoom(1)} aria-label="확대">+</button>
          </div>
        </form>
      </div>

      <div
        className="border rounded overflow-hidden bg-white h-full"
        style={fill ? undefined : { height: '80vh' }}
      >
        {displaySrc ? (
          <iframe
            title="PDF Viewer"
            src={viewerSrc}
            className="w-full h-full"
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-muted">
            불러올 PDF를 선택하거나 URL을 입력하세요.
          </div>
        )}
      </div>
    </div>
  );
}
