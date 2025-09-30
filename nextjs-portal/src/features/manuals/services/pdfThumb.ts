"use client";

// pdf.js 제거: 업로드 시 썸네일은 사전 생성 이미지 사용을 권장.
// 다만 업로드 UX 유지를 위해 간단한 플레이스홀더 이미지를 캔버스로 생성해 반환합니다.
export async function generatePdfThumbnail(_file: File, width = 320): Promise<Blob> {
  const height = Math.round(width * 1.35);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  // 배경
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // 가장자리
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // 상단 바
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, width, 36);

  // PDF 표시 텍스트
  ctx.fillStyle = '#374151';
  ctx.font = 'bold 28px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PDF', width / 2, height / 2);

  // 저장
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  if (blob) return blob;
  const blob2: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob2) throw new Error('Failed to generate thumbnail blob');
  return blob2;
}
