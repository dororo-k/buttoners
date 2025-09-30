import { create } from 'zustand';

// NOTE: notices 관련 서버 상태는 모두 react-query로 이전되었습니다.
// 이 스토어는 더 이상 사용되지 않거나, 
// 추후 공지사항 관련 순수 클라이언트 상태가 필요할 경우 사용될 수 있습니다.

interface NoticeState {
  // 현재 관리하는 상태 없음
}

const useNoticeStore = create<NoticeState>()(() => ({
  // 초기 상태 없음
}));

export default useNoticeStore;