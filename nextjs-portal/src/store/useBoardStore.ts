import { create } from 'zustand';
import type { BoardPost, Comment } from '@/features/board/types';

// NOTE: posts 관련 상태는 react-query로 이전되었습니다.
// 이 스토어는 댓글 등 순수 클라이언트 상태나, 
// react-query로 관리하기 복잡한 상태를 위해 유지됩니다.

export interface BoardState {
  comments: Comment[];
  commentLikes: Record<string, Set<string>>;
  fetchCommentLikes: (commentId: string) => Promise<void>;
  toggleCommentLike: (commentId:string, userId: string) => Promise<void>;
  addComment: (comment: Comment) => void;
  addReply: (comment: Comment) => void;
  updateComment: (commentId: string, patch: Partial<Comment>) => void;
  deleteComment: (commentId: string) => void;
}

export const createBoardStore = (initialState: Partial<BoardState> = {}) => 
  create<BoardState>()((set, get) => ({
    comments: [],
    commentLikes: {},

    // 댓글 관련 로직 (추후 react-query로 이전 고려)
    fetchCommentLikes: async (commentId: string) => {
      // This would be implemented in the repo as well
    },
    toggleCommentLike: async (commentId, userId) => {
      set(state => {
        const newCommentLikes = { ...state.commentLikes };
        const likesSet = newCommentLikes[commentId] ? new Set(newCommentLikes[commentId]) : new Set<string>();
        if (likesSet.has(userId)) {
          likesSet.delete(userId);
        } else {
          likesSet.add(userId);
        }
        newCommentLikes[commentId] = likesSet;
        const newComments = state.comments.map(comment =>
          comment.id === commentId
            ? { ...comment, likes: likesSet.size }
            : comment
        );
        return { comments: newComments, commentLikes: newCommentLikes };
      });
    },
    addComment: (comment) => set((state) => ({ comments: [...state.comments, comment] })), 
    addReply: (reply) => set((state) => ({ comments: [...state.comments, reply] })), 
    updateComment: (commentId, patch) => set((state) => ({ comments: state.comments.map(c => c.id === commentId ? {...c, ...patch} : c) })), 
    deleteComment: (commentId) => set((state) => ({ comments: state.comments.filter(c => c.id !== commentId) })), 

    ...initialState,
  }));




