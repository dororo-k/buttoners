import { ThumbsUp, Edit, Trash2, UserCircle2, Crown, ChevronDown, ChevronUp } from 'lucide-react';
import { notifications } from '@mantine/notifications';
import { updateCommentAction, addCommentAction } from '../actions';

// src/features/board/components/CommentItem.tsx

import React, { useState } from 'react';
import dayjs from 'dayjs'; // 날짜 포맷팅을 위한 라이브러리 (설치 필요: yarn add dayjs)
import { useToggleCommentLikeMutation } from '../hooks/useCommentMutations';
import type { Comment, Staff } from '../types'; // Staff 타입은 현재 로그인한 유저 타입으로 가정
import { CommentForm } from './CommentForm'; // 댓글 입력을 위한 폼 컴포넌트가 있다고 가정
import { useToggle } from '@/hooks/useToggle'; // useToggle 훅 임포트
import type { Account } from '@/types';
import { Modal } from '@/components/Modal'; // Import Modal component

// CommentItem 컴포넌트가 받을 props 타입을 정의합니다.
interface CommentItemProps {
  comment: Comment;
  childComments: Comment[];
  entityId: string;
  currentUser: Account | null; // 로그인하지 않았을 수 있으므로 null 허용
  onDelete: (commentId: string) => void;
  onUpdate: (commentId: string, patch: Partial<Comment>) => void;
  onAddReply: (reply: Comment) => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  childComments,
  entityId,
  currentUser,
  onDelete,
  onUpdate,
  onAddReply,
}) => {
  // 1. 상태 관리: 수정 모드, 답글 모드를 위한 state
  const [isEditing, toggleEditing, setEditingTrue, setEditingFalse] = useToggle();
  const [isReplying, toggleReplying] = useToggle();
  const [showDeleteModal, toggleDeleteModal, setDeleteModalTrue, setDeleteModalFalse] = useToggle();
  // 2. 훅 사용: '좋아요' 토글을 위한 뮤테이션 훅
  const toggleLikeMutation = useToggleCommentLikeMutation(entityId);

  // 3. 조건부 렌더링을 위한 변수들
  // 현재 유저가 댓글 작성자인지 확인
  const isAuthor = !comment.isAnonymous && !!currentUser && currentUser.nickname === comment.author;
  // 현재 유저가 '좋아요'를 눌렀는지 확인 (comment 객체에 likedByUsers 배열이 있다고 가정)
  const hasLiked = comment.likedByUsers?.includes(currentUser?.uid ?? '');
  const authorLevel = Math.floor((comment.authorExp ?? 0) / 100);

  const handleLikeClick = () => {
    if (!currentUser) { try { notifications.show({ color: 'red', message: '로그인이 필요합니다.' }); } catch {}; return; }
    // Optimistic-like update for UI responsiveness can be handled inside the mutation hook
    toggleLikeMutation.mutate({ commentId: comment.id, userId: currentUser.uid });
  };

  const handleDelete = () => {
    setDeleteModalTrue(); // Open the custom modal
  };

  const handleConfirmDelete = () => {
    onDelete(comment.id);
    setDeleteModalFalse(); // Close the modal after deletion
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 rounded-full bg-elev flex items-center justify-center shrink-0">
          <UserCircle2 className="w-6 h-6 text-muted" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between text-sm w-full"> {/* Added justify-between and w-full */}
            <div className="flex items-center space-x-2">
              <span className="font-semibold">{comment.isAnonymous ? '익명' : comment.author}</span>
              {!comment.isAnonymous &&
                (comment.authorPosition === 'admin' ? (
                  <Crown className="h-4 w-4 text-yellow-400" />
                ) : (
                  <span className="text-xs font-bold text-green-400 border border-green-400/50 rounded-md px-1.5 py-0.5">
                    Lv. {authorLevel}
                  </span>
                ))}
            </div>
            <span className="text-gray-500">{comment.createdAt ? dayjs(comment.createdAt.toDate()).format('YYYY.MM.DD HH:mm') : ''}</span>
          </div>

          {isEditing ? (
            <CommentForm
              action={updateCommentAction.bind(null, comment.id, entityId)}
              initialContent={comment.content}
              onCancel={setEditingFalse}
              onSuccess={setEditingFalse}
              submitButtonText="수정 완료"
            />
          ) : (
            <p className="mt-1 text-ink whitespace-pre-wrap">{comment.content}</p>
          )}
        </div>
      </div>

      {!isEditing && (
         <div className="pl-11 flex items-center justify-between text-sm text-gray-500 w-full mt-2">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLikeClick}
              disabled={toggleLikeMutation.isPending}
              className="flex items-center gap-1.5 text-muted hover:text-brand transition-colors group"
              aria-pressed={hasLiked}
            >
              <ThumbsUp
                className={`h-4 w-4 transition-all group-hover:scale-110 group-active:scale-95 ${
                  hasLiked ? 'fill-brand text-brand' : 'text-muted'
                }`}
              />
              <span className="tabular-nums font-medium min-w-[1.5ch] text-left">
                {comment.likes > 0 ? comment.likes : ''}
              </span>
            </button>
            <button onClick={toggleReplying} className="flex items-center gap-1.5 text-muted hover:text-ink transition-colors group" aria-expanded={isReplying}>
              {isReplying ? (
                <ChevronUp className="h-4 w-4 transition-transform group-hover:scale-105 group-active:scale-95" />
              ) : (
                <ChevronDown className="h-4 w-4 transition-transform group-hover:scale-105 group-active:scale-95" />
              )}
              <span>답글</span>
              {childComments && childComments.length > 0 && (
                <span className="font-medium text-brand">{childComments.length}</span>
              )}
            </button>
          </div>
          {isAuthor && (
            <div className="flex items-center space-x-2">
              <button onClick={setEditingTrue} className="flex items-center gap-1.5 text-muted hover:text-ink transition-colors group"><Edit className="w-4 h-4 transition-transform group-hover:scale-105 group-active:scale-95" /><span>수정</span></button>
              <button onClick={handleDelete} className="flex items-center gap-1.5 text-muted hover:text-red-500 transition-colors group"><Trash2 className="w-4 h-4 transition-transform group-hover:scale-105 group-active:scale-95" /><span>삭제</span></button>
            </div>
          )}
         </div>
      )}

      {/* 답글 목록 및 답글 폼 섹션 */}
      <div className={`pl-5 mt-4 pt-4 border-l-2 border-border/50 flex-col gap-y-4 overflow-hidden transition-all duration-300 ease-in-out ${isReplying ? 'flex' : 'hidden'}`}>
        {/* 기존 답글 목록 */}
        {childComments && childComments.length > 0 && (
          <div className="flex flex-col gap-y-4">
            {childComments.map(child => (
              <CommentItem
                key={child.id}
                comment={child}
                childComments={[]}
                entityId={entityId}
                currentUser={currentUser}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onAddReply={onAddReply}
              />
            ))}
          </div>
        )}
        {/* 답글 작성 폼 */}
        <CommentForm
          action={async (prevState: any, formData: FormData) => {
            const currentParentId = comment.id; // Explicitly get comment.id here
            console.log('CommentItem: Calling addCommentAction with postId:', entityId, 'parentId:', currentParentId, 'formData:', formData);
            return addCommentAction(entityId, currentParentId, formData);
          }}
          onCancel={() => {
            // 답글 폼은 취소 시 닫히지 않고, 답글 목록 전체가 닫히도록 상위 버튼으로 제어
          }}
          submitButtonText="답글 작성"
        />
      </div>
      {/* ... rest of the component ... */}
      {showDeleteModal && (
        <Modal open={showDeleteModal} onClose={setDeleteModalFalse} title="댓글 삭제 확인">
          <div className="p-4">
            <p>정말로 이 댓글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
          </div>
          <div className="flex justify-end mt-4 gap-2">
            <button onClick={setDeleteModalFalse} className="btn-ghost">
              취소
            </button>
            <button onClick={handleConfirmDelete} className="btn-danger">삭제</button>
          </div>
        </Modal>
      )}
    </div>
  );
};
