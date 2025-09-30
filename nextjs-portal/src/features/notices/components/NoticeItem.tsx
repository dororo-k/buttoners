import React from 'react';
import type { Notice } from '@/types/notice';
import Link from 'next/link';
import { deleteNoticeAction } from '../actions';

// 1. 필요한 모든 데이터와 핸들러를 Props로 정의
interface NoticeItemProps {
  notice: Notice;
  isAdmin: boolean;
  rowNumber: number;
}

// 2. 컴포넌트는 이제 순수하게 Props를 받아 UI를 그리는 역할만 담당
const NoticeItem: React.FC<NoticeItemProps> = ({
  notice,
  isAdmin,
  rowNumber,
}) => {

  // `createdAt`이 Timestamp 객체거나 ISO 문자열인 경우 모두 처리
  const formattedDate = (() => {
    if (!notice.createdAt) return '';
    // Timestamp 객체인 경우 (낙관적 업데이트 시)
    if (typeof (notice.createdAt as any).toDate === 'function') {
      return (notice.createdAt as any).toDate().toLocaleDateString();
    }
    // ISO 문자열인 경우 (서버에서 전달 시)
    return new Date(notice.createdAt as any).toLocaleDateString();
  })();

    return (
        <tr key={notice.id} className="transition-colors hover:bg-elev">
            <td className="px-4 py-2 text-muted">{rowNumber}</td>
            <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                    <Link href={`/notices/${notice.no}`} className="text-ink hover:underline font-medium truncate" title={notice.title}>
                        {notice.title}
                    </Link>
                    {notice.pinned && (
                        <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">고정</span>
                    )}
                </div>
            </td>
            <td className="px-4 py-2 text-center text-muted">
                {formattedDate}
            </td>
        </tr>
    );
};

export default NoticeItem;
