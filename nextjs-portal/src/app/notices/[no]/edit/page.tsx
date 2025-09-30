'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminOnly from '@/components/AdminOnly';
import { getNotice } from '@/features/notices/services/noticeRepo';
import { useUpdateNoticeMutation } from '@/features/notices/hooks/useNoticeQueries';
import { notifications } from '@mantine/notifications';
import type { Notice } from '@/types/notice';

type Props = {
  params: { no: string };
};

export default function NoticeEditPage({ params }: Props) {
  const { no: noStr } = params;
  const no = Number(noStr);
  const router = useRouter();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false); // State for pinned status

  const updateNoticeMutation = useUpdateNoticeMutation();

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const data = await getNotice(no);
        if (data) {
          setNotice(data);
          setTitle(data.title);
          setBody(data.body);
          setPinned(data.pinned); // Set initial pinned status
        } else {
          router.push('/notices');
        }
      } catch (error) {
        console.error('Failed to fetch notice for editing:', error);
        router.push('/notices');
      } finally {
        setLoading(false);
      }
    };
    fetchNotice();
  }, [no, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notice) return;

    try {
      await updateNoticeMutation.mutateAsync({
        id: notice.id,
        no: notice.no,
        title,
        body,
        pinned, // Include pinned status in update
      });
      router.push(`/notices/${no}`);
    } catch (error) {
      console.error('Failed to update notice:', error);
      try { notifications.show({ color: 'red', message: '공지사항 수정에 실패했습니다.' }); } catch {}
    }
  };

  if (loading) return <div className="p-6">공지사항 불러오는 중...</div>;
  if (!notice) return <div className="p-6">공지사항을 찾을 수 없습니다.</div>;

  return (
    <AdminOnly>
      <div className="space-y-6"> {/* Removed p-6 */}
        <h1 className="text-2xl font-semibold text-ink">공지사항 수정</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-muted">제목</label>
            <input
              type="text"
              id="title"
              className="input w-full mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="body" className="block text-sm font-medium text-muted">내용</label>
            <textarea
              id="body"
              className="input w-full mt-1 h-48"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="pinned"
              className="radio"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
            />
            <label htmlFor="pinned" className="ml-2 text-sm font-medium text-muted">상단 고정</label>
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={() => router.push(`/notices/${no}`)} className="btn-ghost">취소</button>
            <button type="submit" className="btn-primary" disabled={updateNoticeMutation.isPending}>
              {updateNoticeMutation.isPending ? '저장 중...' : '수정 완료'}
            </button>
          </div>
        </form>
      </div>
    </AdminOnly>
  );
}
