"use client";

import PdfThumbnail from './PdfThumbnail';

type Props = {
  title: string;
  url: string;
  thumbUrl?: string | null;
  onOpen?: () => void;
};

export default function ManualCard({ title, url, thumbUrl, onOpen }: Props) {
  const viewerUrl = `/manuals/viewer?src=${encodeURIComponent(url)}&fullscreen=1`;
  return (
    <a
      href={viewerUrl}
      className="group block rounded-lg border border-border bg-surface hover:bg-elev transition-colors overflow-hidden"
      onClick={onOpen}
      aria-label={`${title} 열람`}
    >
      <div className="aspect-[4/3] w-full bg-white grid place-items-center">
        {thumbUrl ? (
          // Prefer pre-generated thumbnail if available
          <img src={thumbUrl} alt="PDF 썸네일" className="h-full w-full object-contain p-2" />
        ) : (
          <PdfThumbnail url={url} className="h-full w-full" />
        )}
      </div>
      <div className="px-3 py-2">
        <div className="truncate font-medium group-hover:text-brand" title={title}>
          {title}
        </div>
        <div className="text-xs text-muted">열람하려면 클릭</div>
      </div>
    </a>
  );
}
