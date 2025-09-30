import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import * as commentClientService from '../services/commentClientService';
import { addCommentServerAction, updateCommentServerAction, deleteCommentServerAction, toggleBoardCommentLikeServerAction } from '../actions';

import type { Comment, AddCommentInput } from '../types/index';
import { Timestamp } from 'firebase/firestore'; // Assuming Timestamp is needed

const queryKey = (postId: string) => ['board', postId, 'comments'];

// 댓글 실시간 구독 훅
export function useCommentsSubscription(postId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!postId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);

            const unsubscribe = commentClientService.getCommentsSubscription(postId, (comments) => {
      setComments(comments);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [postId]);

  return { data: comments, isLoading, isError };
}

// 댓글 추가 훅
export function useAddCommentMutation(postId: string) {
  const queryClient = useQueryClient();
  return useMutation<Comment, Error, AddCommentInput>({
    mutationFn: (newComment) => addCommentServerAction(postId, newComment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey(postId) });
    },
  });
}

// 댓글 업데이트 훅
export function useUpdateCommentMutation(postId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { commentId: string; patch: Partial<Omit<Comment, 'id' | 'postId' | 'createdAt' | 'likes'>> }>({    mutationFn: (variables) => updateCommentServerAction(postId, variables.commentId, variables.patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey(postId) });
    },
  });
}

// 댓글 삭제 훅
export function useDeleteCommentMutation(postId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string, { previousComments: Comment[] | undefined }>({
    mutationFn: (commentId) => deleteCommentServerAction(postId, commentId),
    onMutate: async (commentIdToDelete) => {
      const queryKey = ['comments', postId];
      await queryClient.cancelQueries({ queryKey });
      const previousComments = queryClient.getQueryData<Comment[]>(queryKey);

      queryClient.setQueryData<Comment[]>(queryKey, (old) =>
        old ? old.filter((comment) => comment.id !== commentIdToDelete) : [],
      );
      return { previousComments };
    },
    onError: (err, commentId, context) => {
      if (context?.previousComments) {
        const queryKey = ['comments', postId];
        queryClient.setQueryData(queryKey, context.previousComments);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey(postId) });
    },
  });
}

// toggleCommentLike 뮤테이션의 입력 변수 타입을 정의합니다.
type ToggleCommentLikeVariables = {
  userId: string;
  hasLiked: boolean;
};

// onMutate에서 반환할 컨텍스트 객체의 타입을 정의합니다.
type ToggleCommentLikeContext = {
  previousComments: Comment[] | undefined;
};

/**
 * 댓글 '좋아요' 토글을 위한 useMutation 훅 (낙관적 업데이트 적용)
 */
export function useToggleCommentLikeMutation(postId: string, commentId: string) { // Added postId and commentId as arguments
  const queryClient = useQueryClient();

  return useMutation<void, Error, ToggleCommentLikeVariables, ToggleCommentLikeContext>({
    mutationFn: (variables) =>
      toggleBoardCommentLikeServerAction(postId, commentId, variables.userId),

    onMutate: async ({ userId, hasLiked }) => {
      const queryKey = ['comments', postId];

      await queryClient.cancelQueries({ queryKey });

      const previousComments = queryClient.getQueryData<Comment[]>(queryKey);

      queryClient.setQueryData<Comment[]>(queryKey, (oldComments = []) => {
        return oldComments.map(comment => {
          if (comment.id === commentId) {
            const newLikes = hasLiked ? comment.likes - 1 : comment.likes + 1;
            return { ...comment, likes: newLikes < 0 ? 0 : newLikes };
          }
          return comment;
        });
      });

      return { previousComments };
    },

    onError: (err, variables, context) => {
      if (context?.previousComments) {
        const queryKey = ['comments', postId];
        queryClient.setQueryData(queryKey, context.previousComments);
      }
    },

    onSettled: (data, error, variables) => {
      const queryKey = ['comments', postId];
      queryClient.invalidateQueries({ queryKey });
    },
  });
}