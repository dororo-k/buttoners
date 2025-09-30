'use client';
import React from 'react';
import { useAppStore } from '@/components/providers/StoreProvider';
import { useNoticesQuery } from '../hooks/useNoticeQueries';
import NoticeItem from './NoticeItem';
import type { Notice } from '@/types/notice';
import { deleteNoticeAction } from '../actions';

interface NoticeListProps {
  initialItems: Notice[];
}

const NoticeList: React.FC<NoticeListProps> = ({ initialItems }) => {
  const { data: notices = [], isLoading, isError, error, refetch } = useNoticesQuery({
    initialData: initialItems,
  });
  const isAdmin = useAppStore('adminSession', (state) => state.isAdmin);

  if (isLoading) return <div>공지사항 목록을 불러오는 중...</div>;
  if (isError) return <div className="text-red-500">오류 발생: {error.message} <button onClick={() => refetch()}>재시도</button></div>;

  return (
    <>
      <div className="mb-3 text-sm text-muted">총 <span className="font-semibold text-ink">{notices.length}</span>개 공지</div>
      <table className="min-w-full text-sm table-auto bg-white/10 overflow-x-auto">
        <thead className="bg-elev text-ink">
          <tr>
            <th className="px-4 py-2 text-left w-20 font-semibold">번호</th>
            <th className="px-4 py-2 text-left font-semibold">제목</th>
            <th className="px-4 py-2 text-center w-28 font-semibold">작성일</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {notices.length === 0 && (
            <tr>
              <td className="px-4 py-4 text-center text-muted" colSpan={isAdmin ? 4 : 3}>등록된 공지사항이 없습니다.</td>
            </tr>
          )}
          {notices.map((notice, index) => (
            <NoticeItem
              key={notice.id}
              notice={notice}
              isAdmin={isAdmin}
              rowNumber={notices.length - index}
            />
          ))}
        </tbody>
      </table>
    </>
  );
};

export default NoticeList;
