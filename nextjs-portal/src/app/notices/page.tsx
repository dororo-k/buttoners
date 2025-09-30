import { getNoticesOnce } from '@/features/notices/services/noticeRepo';
import { ensurePlainObject } from '@/features/points/components/ensurePlain';
import NoticesClientPage from './NoticesClientPage';

/**
 * 공지사항 페이지 (Server Component)
 * - 서버에서 초기 데이터를 fetching하여 Client Component에 전달합니다.
 */
export default async function NoticesPage() {
  const rawItems = await getNoticesOnce();
  const initialItems = ensurePlainObject(rawItems);

  return <NoticesClientPage initialItems={initialItems} />;
}
