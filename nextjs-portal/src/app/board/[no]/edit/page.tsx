import { getBoardPostByNoAction } from '@/features/board/actions';
import { getAuthenticatedUser } from '@/lib/session';
import { ensurePlainObject } from '@/features/points/components/ensurePlain';
import BoardForm from '@/features/board/components/BoardForm';
import { notFound } from 'next/navigation';

export default async function BoardEditPage({ params }: { params: { no: string } }) {
  const postNumber = Number(params.no);
  if (isNaN(postNumber)) {
    notFound();
  }

  const rawPost = await getBoardPostByNoAction(postNumber);
  if (!rawPost) {
    notFound();
  }

  const user = await getAuthenticatedUser();
  const isAuthorized = user && (user.position === 'admin' || user.uid === rawPost.authorUid);

  if (!isAuthorized) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-panel p-6 rounded-lg shadow text-red-500">
          이 게시물을 수정할 권한이 없습니다.
        </div>
      </div>
    );
  }

  const post = ensurePlainObject(rawPost);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold mb-4">게시물 수정</h1>
      <BoardForm initialValue={post} />
    </div>
  );
}
