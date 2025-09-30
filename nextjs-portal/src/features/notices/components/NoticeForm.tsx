import React, { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { addNoticeAction } from '../actions';

interface NoticeFormProps {
  onSubmitted?: () => void;
  onCancel?: () => void;
}

const initialState = {
  message: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? '등록 중...' : '등록'}
    </button>
  );
}

const NoticeForm: React.FC<NoticeFormProps> = ({ onSubmitted, onCancel }) => {
  const [state, formAction] = useFormState(addNoticeAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message === 'success') {
      formRef.current?.reset();
      onSubmitted?.();
    }
  }, [state, onSubmitted]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4">
      <div>
        <label htmlFor="notice-title" className="block text-sm font-medium mb-1">제목</label>
        <input
          id="notice-title"
          name="title"
          type="text"
          className="input w-full"
          placeholder="제목을 입력하세요"
          required
        />
      </div>

      <div>
        <label htmlFor="notice-body" className="block text-sm font-medium mb-1">내용</label>
        <textarea
          id="notice-body"
          name="body"
          rows={6}
          className="input w-full"
          placeholder="내용을 입력하세요"
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <SubmitButton />
        {onCancel && (
          <button type="button" className="btn-ghost" onClick={onCancel}>취소</button>
        )}
      </div>
      {state.message && state.message !== 'success' && (
         <p className="mt-2 text-sm text-red-500 text-right">{state.message}</p>
      )}
    </form>
  );
};

export default NoticeForm;

