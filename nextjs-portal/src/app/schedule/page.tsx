'use client';

import PageLayout from '@/components/PageLayout';

export default function SchedulePage() {
  return (
    <PageLayout
      title="일정표"
      description="팀원의 근무 일정을 확인하고 관리합니다."
    >
      <div className="mt-6 card text-center text-muted">
        <p>일정표 기능은 여기에 표시됩니다.</p>
      </div>
    </PageLayout>
  );
}
