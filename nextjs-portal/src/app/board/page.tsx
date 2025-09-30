import { getBoardPostsOnceAction } from '@/features/board/actions';
import BoardClientPage from './BoardClientPage';
import { ensurePlainObject } from '@/features/points/components/ensurePlain';

/**
 * 자유게시판 페이지 (Server Component)
 * - 서버에서 초기 데이터(첫 페이지만)를 fetching하여 Client Component에 전달합니다.
 */
export default async function BoardPage() {
  const firstPage = await getBoardPostsOnceAction({});
  const initialInfiniteData = ensurePlainObject(firstPage);

  return <BoardClientPage initialInfiniteData={initialInfiniteData} />;
}
