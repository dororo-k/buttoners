'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

// --- 소품 컴포넌트: 폼 제출 버튼 ---
function SubmitButton({ text }: { text: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary btn-sm">
      {pending ? '처리 중…' : text}
    </button>
  );
}

// --- CommentForm Props 정의 ---
interface CommentFormProps {
  // 서버 액션을 직접 받도록 변경
  action: (prevState: any, formData: FormData) => Promise<{ message: string }>;
  initialContent?: string;
  submitButtonText: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}

const BODY_MAX = 1000;

export const CommentForm: React.FC<CommentFormProps> = ({
  action,
  initialContent = '',
  submitButtonText,
  onCancel,
  onSuccess,
}) => {
  const [state, formAction] = useFormState(action, { message: '' });
  const [body, setBody] = useState(initialContent);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const isValid = body.trim().length > 0;

  useEffect(() => {
    if (state.message === 'success') {
      if (!initialContent) { // 새 댓글/답글 작성 시에만 폼 리셋
        setBody('');
        setIsAnonymous(false); // Reset anonymous state
        formRef.current?.reset();
      }
      onSuccess?.();
    }
  }, [state, onSuccess, initialContent]);

  return (
    <form ref={formRef} action={formAction} className="mt-3" noValidate>
      <textarea
        name="content"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="댓글을 입력하세요..."
        maxLength={BODY_MAX}
        rows={3}
        className="w-full bg-transparent"
        required
      />
      <div className="flex justify-between items-center mt-2">
        <div className="text-sm text-muted">
          {body.length}/{BODY_MAX}
        </div>
        <div className="flex gap-2 items-center">
          <label className="flex items-center text-sm text-ink">
            <input
              type="checkbox"
              name="isAnonymous"
              className="checkbox checkbox-sm mr-1"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
            />
            익명
          </label>
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-ghost btn-sm">
              취소
            </button>
          )}
          <SubmitButton text={submitButtonText} />
        </div>
      </div>
      {state.message && state.message !== 'success' && (
        <p className="text-sm text-red-500 text-right mt-1">{state.message}</p>
      )}
    </form>
  );
};