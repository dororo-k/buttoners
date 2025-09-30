import React from 'react';
import type { BoardPost } from '../types';
import { Crown, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { InfiniteData } from '@tanstack/react-query';

interface BoardListProps {
  data: InfiniteData<{
    posts: BoardPost[];
    nextCursor: number | null;
  }> | undefined;
  error: Error | null;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentUser: { uid: string; position: string; } | null;
}

const BoardList: React.FC<BoardListProps> = ({
  data,
  error,
  isFetching,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  searchQuery,
  setSearchQuery,
  currentUser,
}) => {

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  const allPosts = data?.pages.flatMap(page => page.posts) ?? [];
  const totalCount = allPosts.length;

  if (isFetching && !isFetchingNextPage && !data?.pages.length) {
    return <div className="p-6 text-center">게시글 목록을 불러오는 중...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">오류 발생: {error.message}</div>;
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <div className="text-sm text-muted">총 <span className="font-semibold text-ink">{totalCount}</span>개 게시글</div>
        <div className="w-full sm:w-64">
          <input
            className="input text-sm w-full"
            placeholder="제목으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="게시글 검색"
          />
        </div>
      </div>

      <table className="min-w-full text-sm table-auto bg-white/10 overflow-x-auto">
        <thead className="bg-elev text-ink">
          <tr>
            <th className="px-4 py-2 text-left w-20 font-semibold">번호</th>
            <th className="px-4 py-2 text-left font-semibold">제목</th>
            <th className="px-4 py-2 text-left w-36 font-semibold">작성자</th>
            <th className="px-4 py-2 text-center w-28 font-semibold">작성일</th>
            <th className="px-4 py-2 text-right w-20 font-semibold">조회수</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {allPosts.map((item, index) => (
            <tr key={item.id} className="transition-colors hover:bg-elev">
              <td className="px-4 py-2 text-muted">{item.no}</td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <Link href={`/board/${item.no}`} className="text-ink hover:underline font-medium truncate" title={item.title}>{item.title}</Link>
                  {item.commentsCount > 0 && (
                    <span className="text-xs text-brand">[{item.commentsCount}]</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-2 text-ink">
                <div className="flex items-center gap-2">
                  <span>{item.isAnonymous ? '익명' : item.author}</span>
                  {!item.isAnonymous && item.authorPosition === 'admin' ? (
                    <Crown className="h-4 w-4 text-yellow-400" />
                  ) : (
                    !item.isAnonymous && (
                      <span className="text-xs font-bold text-green-400 border border-green-400/50 rounded-md px-1.5 py-0.5">
                        Lv. {Math.floor((item.authorExp ?? 0) / 100)}
                      </span>
                    )
                  )}
                </div>
              </td>
              <td className="px-4 py-2 text-center text-muted">{formatDate(item.createdAt)}</td>
              <td className="px-4 py-2 text-right text-ink tabular-nums">{item.views}</td>
            </tr>
          ))}
          {allPosts.length === 0 && !isFetching && (
            <tr>
              <td className="px-4 py-4 text-center text-muted" colSpan={5}>게시글이 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-6 text-center">
        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="btn-secondary w-full sm:w-auto"
          >
            {isFetchingNextPage ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 불러오는 중...</>
            ) : (
              '더보기'
            )}
          </button>
        )}
      </div>
    </>
  );
};

export default BoardList;
