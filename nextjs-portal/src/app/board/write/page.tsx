'use client';

import PageLayout from '@/components/PageLayout';
import BoardForm from '@/features/board/components/BoardForm';

export default function WriteBoardPage() {
  return (
    <PageLayout title="새 게시물 작성" description="새로운 게시물을 작성합니다.">
      <BoardForm />
    </PageLayout>
  );
}
