import { create } from 'zustand';

// NOTE: 게시판 관련 모든 서버 상태(게시물, 댓글, 좋아요 등)는

// 이 스토어는 더 이상 사용되지 않습니다.

interface BoardState {}

const useBoardStore = create<BoardState>()(() => ({}));

export default useBoardStore;
