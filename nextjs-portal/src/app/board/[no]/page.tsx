import { getBoardPostByNoAction, deletePostAction, incrementBoardViewsAction } from '@/features/board/actions';
import { getAuthenticatedUser } from '@/lib/session';
import { ensurePlainObject } from '@/features/points/components/ensurePlain';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CommentList } from '@/features/board/components/CommentList';
import { Crown } from 'lucide-react'; // Import Crown icon

export default async function BoardDetailPage({ params }: { params: { no: string } }) {
  const postNumber = Number(params.no);
  if (isNaN(postNumber)) {
    notFound();
  }

  const rawPost = await getBoardPostByNoAction(postNumber);
  if (!rawPost) {
    notFound();
  }

  // 조회수 증가
  await incrementBoardViewsAction(rawPost.id);

  // Firestore 데이터를 클라이언트로 전달하기 위해 직렬화합니다.
  const post = ensurePlainObject(rawPost);

  const user = await getAuthenticatedUser();
  const isAuthorized = user && (user.position === 'admin' || user.uid === post.authorUid);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <article>
        <header className="mb-4 border-b border-border pb-4">
          <h1 className="text-3xl font-bold text-ink">{post.title}</h1>
          <div className="mt-2 text-sm text-muted flex items-center gap-4 justify-between"> {/* Added justify-between */}
            <div className="flex items-center gap-4"> {/* Wrapped spans */}
              <span>작성자: {post.isAnonymous ? '익명' : post.author}</span>
              {!post.isAnonymous && post.authorPosition === 'admin' && ( // Add Crown for admin
                <Crown className="h-4 w-4 text-yellow-400" />
              )}
              <span>작성일: {new Date(post.createdAt).toLocaleDateString()}</span>
              <span>조회수: {post.views}</span>
            </div>
            {isAuthorized && (
              <div className="flex items-center gap-2"> {/* Buttons, removed mb-4 */}
                <Link href={`/board/${post.no}/edit`} className="btn-secondary btn-sm">
                  수정
                </Link>
                <form action={deletePostAction.bind(null, post.id)}>
                  <button type="submit" className="btn-danger btn-sm">
                    삭제
                  </button>
                </form>
              </div>
            )}
          </div>
        </header>

        <div className="prose prose-invert max-w-none min-h-[5em]">
          {/* TODO: Render content safely, e.g., using markdown-to-jsx */}
          <p>{post.content}</p>
        </div>

        <div className="border-t border-border mt-6 pt-6"></div> {/* Thin line */}
      </article>

      <CommentList entityId={post.id} />
    </div>
  );
}
