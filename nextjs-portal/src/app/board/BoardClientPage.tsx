'use client';

import PageLayout from '@/components/PageLayout';
import { useState } from 'react';
import BoardList from '@/features/board/components/BoardList';
import { useAppStore } from '@/components/providers/StoreProvider';
import type { BoardPost } from '@/features/board/types';
import { useInfinitePostsQuery } from '@/features/board/hooks/useBoardQueries';
import { useDebounce } from '@/hooks/useDebounce';
import Link from 'next/link';

interface BoardClientPageProps {
  initialInfiniteData: {
    posts: BoardPost[];
    nextCursor: number | null;
  };
}

export default function BoardClientPage({ initialInfiniteData }: BoardClientPageProps) {
  const currentUser = useAppStore('staffSession', (s: any) => (s as any).currentUser);
  const isLoggedIn = !!currentUser;
  const nickname = currentUser?.nickname || currentUser?.name || '';

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  const { 
    data, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetching, 
    isFetchingNextPage 
  } = useInfinitePostsQuery({
    query: debouncedQuery,
    initialData: {
      pages: [initialInfiniteData],
      pageParams: [undefined],
    },
  });

  return (
    <PageLayout title="자유게시판" description="자유롭게 이야기를 나누는 공간입니다.">
      <div className="flex items-center justify-between">
        <div /> {/* For spacing */}        {isLoggedIn && (
          <Link href="/board/write" className="btn-primary">
            글쓰기
          </Link>
        )}
      </div>

      <BoardList
        data={data}
        error={error}
        isFetching={isFetching}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        currentUser={currentUser}
      />
    </PageLayout>
  );
}
