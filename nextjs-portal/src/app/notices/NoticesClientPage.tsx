'use client';

import PageLayout from '@/components/PageLayout';
import NoticeList from '@/features/notices/components/NoticeList';
import NoticeForm from '@/features/notices/components/NoticeForm';
import { useAppStore } from '@/components/providers/StoreProvider';
import { useToggle } from '@/hooks/useToggle';
import type { Notice } from '@/types/notice';

interface NoticesClientPageProps {
  initialItems: Notice[];
}

export default function NoticesClientPage({ initialItems }: NoticesClientPageProps) {
  const isAdminByAdminSession = useAppStore('adminSession', (state) => state.isAdmin);
  const isAdminByRole = useAppStore('staffSession', (s: any) => (s as any)?.currentUser?.position === 'admin');
  const isAdmin = isAdminByAdminSession || isAdminByRole;
  const [showForm, toggleForm, , closeForm] = useToggle(false);

  return (
    <PageLayout title="공지사항" description="중요한 소식들을 확인하세요.">
      <div className="flex items-center justify-between">
        <div /> {/* For spacing */}        {isAdmin && (
          <button
            type="button"
            onClick={toggleForm}
            className="btn-primary"
            aria-expanded={showForm}
            aria-controls="notice-form-section"
          >
            {showForm ? '작성 취소' : '글쓰기'}
          </button>
        )}
      </div>

      {showForm && (
        <section id="notice-form-section" className="card">
          <NoticeForm onSubmitted={closeForm} onCancel={closeForm} />
        </section>
      )}

      <NoticeList initialItems={initialItems} />
    </PageLayout>
  );
}
