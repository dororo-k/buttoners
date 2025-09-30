"use client";

import { useState } from 'react';
import { uploadManual } from '../services/manualsRepo';
import { generatePdfThumbnail } from '../services/pdfThumb';
import type { ManualCategory } from '../types';
import AdminOnly from '@/components/AdminOnly';

type Props = {
  onUploaded?: () => void;
};

const categories: ManualCategory[] = ['서비스', '식음료', '청소', '기타'];

export default function ManualUpload({ onUploaded }: Props) {
  const [category, setCategory] = useState<ManualCategory>('서비스');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError('PDF 파일을 선택하세요.');
      return;
    }
    if (!file.type.includes('pdf')) {
      setError('PDF 형식의 파일만 업로드 가능합니다.');
      return;
    }
    try {
      setLoading(true);
      let thumbnail: Blob | undefined = undefined;
      try {
        thumbnail = await generatePdfThumbnail(file, 320);
      } catch {
        // 썸네일 생성 실패 시 업로드는 계속 진행
      }
      await uploadManual({ file, category, title, thumbnail });
      setFile(null);
      setTitle('');
      onUploaded?.();
    } catch (err: any) {
      setError(err?.message || '업로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminOnly>
      <div className="card mt-6">
        <h3 className="text-lg font-semibold">관리자: PDF 업로드</h3>
        <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="flex flex-wrap items-center gap-3">
            <label className="w-24 text-sm">카테고리</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ManualCategory)}
              className="border rounded px-2 py-1"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="w-24 text-sm">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="문서 제목 (선택)"
              className="border rounded px-2 py-1 min-w-[280px] flex-1"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="w-24 text-sm">PDF 파일</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="border rounded px-2 py-1"
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="mt-2">
            <button type="submit" className="btn" disabled={loading}>
              {loading ? '업로드 중…' : '업로드'}
            </button>
          </div>
        </form>
      </div>
    </AdminOnly>
  );
}
