import { useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import {
  deleteComment,
  toggleCommentLike,
  updateComment,
} from '@/lib/firebaseClient';
import { notifications } from '@mantine/notifications';
import { Comment } from '../types';

export const useDeleteCommentMutation = (boardId: string) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async commentId => deleteComment(boardId, commentId),
    onSuccess: () => {
      notifications.show({
        title: '성공',
        message: '댓글이 삭제되었습니다.',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['comments', boardId] });
    },
    onError: error => {
      notifications.show({
        title: '오류',
        message: `댓글 삭제 중 오류 발생: ${error.message}`,
        color: 'red',
      });
    },
  });
};

export const useUpdateCommentMutation = (boardId: string) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, Partial<Comment>>({
    mutationFn: async updatedComment => updateComment(boardId, updatedComment),
    onSuccess: () => {
      notifications.show({
        title: '성공',
        message: '댓글이 수정되었습니다.',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['comments', boardId] });
    },
    onError: error => {
      notifications.show({
        title: '오류',
        message: `댓글 수정 중 오류 발생: ${error.message}`,
        color: 'red',
      });
    },
  });
};

export const useToggleCommentLikeMutation = (boardId: string) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { commentId: string; userId: string }>({
    mutationFn: async ({ commentId, userId }) =>
      toggleCommentLike(boardId, commentId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', boardId] });
    },
    onError: (error: Error) => {
      notifications.show({
        title: '오류',
        message: `댓글 좋아요 토글 중 오류 발생: ${error.message}`,
        color: 'red',
      });
    },
  });
};
