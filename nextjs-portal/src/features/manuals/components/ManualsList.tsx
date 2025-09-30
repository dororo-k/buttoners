"use client";

import { useEffect, useMemo, useState } from 'react';
import { notifications } from '@mantine/notifications';
import type { ManualCategory, ManualDoc } from '../types';
import { deleteManual, listManuals } from '../services/manualsRepo';
import AdminOnly from '@/components/AdminOnly';
import ManualCard from './ManualCard';

type Props = {
  initialCategory?: ManualCategory | '전체';
  showCategoryTabs?: boolean;
};

const categoriesAll: Array<ManualCategory | '전체'> = ['전체', '서비스', '식음료', '청소', '기타'];

export default function ManualsList({ initialCategory = '전체', showCategoryTabs = true }: Props) {
  const [category, setCategory] = useState<ManualCategory | '전체'>(initialCategory);
  const [items, setItems] = useState<ManualDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const selectedCategory = useMemo(() => (category === '전체' ? undefined : (category as ManualCategory)), [category]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listManuals(selectedCategory);
      setItems(data);
    } catch (err: any) {
      setError(err?.message || '목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const handleDelete = async (id: string) => {
    if (!confirm('해당 문서를 삭제하시겠습니까?')) return;
    setDeletingId(id);
    try {
      await deleteManual(id);
      await refresh();
    } catch (err: any) {
      try { notifications.show({ color: 'red', message: err?.message || '삭제 중 오류가 발생했습니다.' }); } catch {}
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">매뉴얼 목록</h2>
        {showCategoryTabs && (
          <div className="flex gap-2">
            {categoriesAll.map((c) => (
              <button
                key={c}
                className={`btn ${category === c ? 'btn-primary' : ''}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4">
        {loading && <div className="text-muted">불러오는 중…</div>}
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {!loading && !items.length && <div className="text-muted">등록된 문서가 없습니다.</div>}

        {!loading && items.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((m) => (
              <div key={m.id} className="relative">
                <ManualCard title={m.title} url={m.url} thumbUrl={m.thumbnailUrl} />
                <AdminOnly>
                  <button
                    className="btn absolute top-2 right-2"
                    disabled={deletingId === m.id}
                    onClick={(e) => { e.preventDefault(); handleDelete(m.id); }}
                    aria-label="삭제"
                    title="삭제"
                  >
                    {deletingId === m.id ? '…' : '삭제'}
                  </button>
                </AdminOnly>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
