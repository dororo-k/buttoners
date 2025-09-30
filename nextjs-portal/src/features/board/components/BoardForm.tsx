'use client';

import React, { useEffect, useRef, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { useFormState, useFormStatus } from 'react-dom';
import { addPostAction, updatePostAction } from '../actions';
import type { BoardPost } from '../types';
import { useRouter } from 'next/navigation';

export interface BoardFormProps {
  onSubmitted?: () => void;
  onCancel?: () => void;
  initialValue?: BoardPost & { isAnonymous?: boolean };
}

const initialState = {
  message: '',
};

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? (isEditing ? '수정 중…' : '등록 중…') : (isEditing ? '수정 완료' : '등록')}
    </button>
  );
}

const BoardForm: React.FC<BoardFormProps> = ({
  onSubmitted,
  onCancel,
  initialValue,
}) => {
  const router = useRouter();
  const isEditing = !!initialValue?.id;

  // 수정 또는 추가 액션을 선택합니다.
  const action = isEditing ? updatePostAction.bind(null, initialValue.id) : addPostAction;
  const [state, formAction] = useFormState(action, initialState);
  
  const formRef = useRef<HTMLFormElement>(null);

  const [title, setTitle] = useState(initialValue?.title ?? '');
  const [body, setBody]   = useState(initialValue?.content ?? '');
  const [isAnonymous, setIsAnonymous] = useState(initialValue?.isAnonymous ?? false);

  useEffect(() => {
    if (state.message === 'success') {
      if (isEditing) {
        try { notifications.show({ color: 'green', message: '게시물이 성공적으로 수정되었습니다.' }); } catch {}
        // 수정 완료 후 상세 페이지로 이동
        router.push(`/board/${initialValue.no}`);
      } else {
        // 새 글 작성 완료 후 폼 리셋 및 콜백 호출
        formRef.current?.reset();
        setTitle('');
        setBody('');
        onSubmitted?.();
      }
    }
  }, [state, isEditing, onSubmitted, router, initialValue?.no]);

  return (
    <form ref={formRef} action={formAction} className="card" noValidate>
      <div className="mb-4 relative">
        <label htmlFor="title" className="mb-2 block text-sm font-medium text-muted">
          제목
        </label>
        <input
          type="text"
          id="title"
          name="title"
          maxLength={80}
          className="input"
          placeholder="제목을 입력하세요"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="content" className="mb-2 block text-sm font-medium text-muted">
          내용
        </label>
        <textarea
          id="content"
          name="content"
          rows={10}
          maxLength={2000}
          className="input"
          placeholder="내용을 입력하세요"
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          id="isAnonymous"
          name="isAnonymous"
          className="mr-2"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
        />
        <label htmlFor="isAnonymous" className="text-sm text-muted">
          익명으로 작성
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <SubmitButton isEditing={isEditing} />
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost">
            취소
          </button>
        )}
      </div>
      {state.message && state.message !== 'success' && (
        <p className="mt-2 text-sm text-red-500">{state.message}</p>
      )}
    </form>
  );
};

export default BoardForm;
