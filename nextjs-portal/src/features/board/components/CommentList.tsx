'use client';

import React, { useMemo } from 'react';
import { useAppStore } from '@/components/providers/StoreProvider';
import { CommentItem } from './CommentItem';
import { useCommentsSubscription } from '../hooks/useCommentQueries';
import type { Comment } from '../types/index';
import { addCommentAction, updateCommentAction, deleteCommentAction } from '../actions';
import { CommentForm } from './CommentForm';

interface CommentListProps {
  entityId: string; // postId
}

export const CommentList: React.FC<CommentListProps> = ({ entityId }) => {
  console.log('CommentList: Component rendering started for entityId:', entityId);
  const { data: comments = [], isLoading, isError } = useCommentsSubscription(entityId);
  console.log('CommentList: isLoading:', isLoading, 'isError:', isError);
  console.log('CommentList: comments data received (raw):', comments);
  const currentUser = useAppStore('staffSession', (s: any) => (s as any).currentUser);

  // 댓글 수정 핸들러
  const handleUpdate = (commentId: string, patch: Partial<Comment>) => {
    // updateCommentAction은 formData를 받으므로, 여기서 변환하여 호출
    const formData = new FormData();
    formData.append('content', patch.content || '');
    updateCommentAction(commentId, entityId, null, formData); // prevState는 null로 전달
  };

  // 댓글 삭제 핸들러
  const handleDelete = (commentId: string) => {
    deleteCommentAction(commentId, entityId);
  };

  // 답글 추가 핸들러 (CommentItem에서 호출)
  const handleAddReply = (reply: Comment) => {
    // addCommentAction은 formData를 받으므로, 여기서 변환하여 호출
    const formData = new FormData();
    formData.append('content', reply.content || '');
    formData.append('parentId', reply.parentId || ''); // 답글인 경우 parentId 추가
    addCommentAction(entityId, null, formData); // postId는 entityId, prevState는 null
  };

  // 최상위 댓글과 답글 분리
  const topLevelComments = useMemo(
    () => {
      const filtered = comments.filter(comment => !comment.parentId);
      console.log('CommentList: topLevelComments calculated:', filtered);
      return filtered;
    },
    [comments]
  );

  console.log('CommentList: Rendering with topLevelComments:', topLevelComments);

  if (isLoading) return <div className="p-6 text-center">댓글을 불러오는 중...</div>;
  if (isError) return <div className="p-6 text-center text-red-500">댓글을 불러오는 데 실패했습니다.</div>;

  return (
    <div className="p-4 space-y-2">
      {/* 새 댓글 작성 폼 */}
      <CommentForm
        action={async (prevState: any, formData: FormData) => {
          // 최상위 댓글의 경우 parentId는 null이어야 합니다.
          return addCommentAction(entityId, null, formData);
        }}
        submitButtonText="댓글 등록"
        onSuccess={() => { /* 폼 리셋은 CommentForm 내부에서 처리 */ } }
      />

      {/* 댓글 목록 */}
      {topLevelComments.length === 0 && !isLoading && !isError ? (
        <div className="p-6 text-center text-muted">아직 댓글이 없습니다.</div>
      ) : (
        topLevelComments.map(comment => {
          console.log('CommentList: Mapping comment:', comment.id, comment);
          const childComments = comments.filter(c => c.parentId === comment.id);
          return (
            <CommentItem
              key={comment.id}
              comment={comment}
              childComments={childComments}
              entityId={entityId}
              currentUser={currentUser}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onAddReply={handleAddReply}
            />
          );
        })
      )}
    </div>
  );
};
