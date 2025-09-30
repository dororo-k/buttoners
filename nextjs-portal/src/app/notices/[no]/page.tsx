import { getNotice } from '@/features/notices/services/noticeRepo';
import { getAuthenticatedUser } from '@/lib/session';
import { deleteNoticeAction } from '@/features/notices/actions';
import { ensurePlainObject } from '@/features/points/components/ensurePlain';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Crown } from 'lucide-react'; // Import Crown icon

export default async function NoticeDetailPage({ params }: { params: { no: string } }) {
  const noticeNumber = Number(params.no);
  if (isNaN(noticeNumber)) {
    notFound();
  }

  const rawNotice = await getNotice(noticeNumber);
  if (!rawNotice) {
    notFound();
  }

  const notice = ensurePlainObject(rawNotice);
  const user = await getAuthenticatedUser();
  const isAuthorized = user && user.position === 'admin';

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <article>
        <header className="mb-4 border-b border-border pb-4">
          <div className="flex items-center gap-4">
            {notice.pinned && <span className="tag-primary">고정</span>}
            <h1 className="text-3xl font-bold text-ink">{notice.title}</h1>
          </div>
          <div className="mt-2 text-sm text-muted flex items-center gap-4 justify-between"> {/* Added justify-between */}
            <div className="flex items-center gap-4"> {/* Wrapped spans */}
              <span>작성자: {notice.authorName || '관리자'}</span>
              {notice.authorName === '관리자' && ( // Assuming '관리자' means admin
                <Crown className="h-4 w-4 text-yellow-400" />
              )}
              <span>작성일: {new Date(notice.createdAt).toLocaleDateString()}</span>
              <span>조회수: {notice.viewCount}</span>
            </div>
            {isAuthorized && (
              <div className="flex items-center gap-2"> {/* Buttons, removed mb-4 */}
                {/* TODO: Implement Edit Page */}
                {/* <Link href={`/notices/${notice.no}/edit`} className="btn-secondary btn-sm">수정</Link> */}
                <form action={deleteNoticeAction.bind(null, notice.id)}>
                  <button type="submit" className="btn-danger btn-sm">
                    삭제
                  </button>
                </form>
              </div>
            )}
          </div>
        </header>

        <div className="prose prose-invert max-w-none min-h-[5em]">
          <p>{notice.body}</p>
        </div>

        <div className="border-t border-border mt-6 pt-6"></div> {/* Thin line */}
      </article>
    </div>
  );
}