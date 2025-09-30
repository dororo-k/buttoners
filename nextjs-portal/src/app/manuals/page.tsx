'use client';

import PageLayout from '@/components/PageLayout';
import ManualsList from '@/features/manuals/components/ManualsList';
import ManualUpload from '@/features/manuals/components/ManualUpload';
import AdminOnly from '@/components/AdminOnly';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { ManualCategory } from '@/features/manuals/types';

const CATEGORIES: ManualCategory[] = ['서비스', '식음료', '청소', '기타'];

export default function ManualsPage() {
  const params = useSearchParams();
  const urlCat = params.get('cat') as ManualCategory | null;
  const [activeCat, setActiveCat] = useState<ManualCategory>(urlCat ?? '서비스');

  const tabs = useMemo(() => CATEGORIES, []);

  return (
    <PageLayout
      title="업무 매뉴얼"
      description="업무에 필요한 매뉴얼을 업로드하고 열람할 수 있습니다."
    >
      <div className="flex items-center justify-between mt-6">
        <div className="flex border-b border-gray-200">
          {tabs.map((c) => (
            <button
              key={c}
              className={`py-2 px-4 text-sm font-medium ${activeCat === c ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <AdminOnly>
          <a href="#manual-upload" className="btn-primary">PDF 업로드</a>
        </AdminOnly>
      </div>

      <div className="mt-6 space-y-6">
        <div id="manual-upload">
          <ManualUpload />
        </div>
        <ManualsList key={activeCat} initialCategory={activeCat} showCategoryTabs={false} />
      </div>
    </PageLayout>
  );
}
