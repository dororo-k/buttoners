'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
// no toast on signup/login/logout flows
import { useStaffAuthForm } from '@/features/staff/hooks/useStaffAuthForm';
import PageLayout from '@/components/PageLayout';
import { useFormStatus } from 'react-dom';
import { useAppStore } from '@/components/providers/StoreProvider';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? '처리 중...' : '회원가입'}
    </button>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const setCurrentUser = useAppStore('staffSession', (s: any) => (s as any).setCurrentUser);
  const {
    form,
    handleChange,
    formatPhone,
    setForm,
    signupState,
    signupAction,
  } = useStaffAuthForm('signup');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverMessage, setServerMessage] = useState('');

  const joinDateRef = useRef<HTMLInputElement>(null);

  const openPicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    try {
      type InputWithPicker = HTMLInputElement & { showPicker?: () => void };
      (ref.current as InputWithPicker)?.showPicker?.();
    } catch {}
    ref.current?.focus();
  };

  // 서버 응답 상태 기반 처리 (성공 시 자동 로그인 및 리다이렉트)
  useEffect(() => {
    const run = async () => {
      if (!signupState) return;
      if (signupState.message && signupState.message !== 'success') {
        setServerMessage(signupState.message);
        return;
      }
      const token = (signupState as any).token as string | undefined;
      if (signupState.message === 'success' && token) {
        try {
          const { auth } = await import('@/lib/firebaseClient');
          const { signInWithCustomToken } = await import('firebase/auth');
          const cred = await signInWithCustomToken(auth, token);
          const idToken = await cred.user.getIdToken();
          await fetch('/api/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) });
          try {
            const resp = await fetch('/api/whoami');
            if (resp.ok) {
              const data = await resp.json();
              if (data?.authenticated && data?.user) setCurrentUser(data.user);
            }
          } catch {}
          // 하드 리로드로 상단 사용자 정보 즉시 반영 (세션 쿠키 포함)
          try {
            if (typeof window !== 'undefined') {
              window.location.replace('/');
              return;
            }
          } catch {}
          router.push('/');
          router.refresh();
        } catch (err: any) {
          setServerMessage(err?.message || '자동 로그인 처리 중 오류가 발생했습니다.');
        }
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signupState]);

  return (
    <PageLayout title="회원가입" description="버트너스 포털에 오신 것을 환영합니다.">
      <div className="w-full max-w-lg mx-auto">
        <form className="mb-4" onSubmit={(e) => e.preventDefault()}>
          <h2 className="text-sm font-semibold mb-2">개인정보 수집·이용 안내</h2>
          <div className="rounded-md border border-border bg-panel p-3 max-h-20 overflow-auto scroll-thin">
            <div className="text-xs leading-5 space-y-1">
              <p>저희 버트너스에 오신 여러분을 환영합니다.</p>
              <p>이 사이트는 버트너에 의해 개설된 개별 페이지입니다.</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>개인정보의 수집 및 이용에 동의합니다.</li>
                <li>비밀번호는 암호화되어 저장되며 관리자도 이를 알지 못합니다.</li>
                <li>퇴사 후 1년이 지나면 개인정보는 자동으로 삭제됩니다.</li>
              </ol>
            </div>
          </div>
          {errors.consent && <div className="text-xs text-red-500 mt-2">*** {errors.consent}</div>}
          <label className="mt-2 flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" name="consent" checked={form.consent} onChange={handleChange} />
            <span className="leading-5">위 내용을 확인했으며, 개인정보 수집·이용에 동의합니다.</span>
          </label>
        </form>

        <form
          action={async (formData) => {
            /* no-op to satisfy types */
          }}
          onSubmit={async (e) => {
            e.preventDefault();
            const requiredMissing = !form.name || !form.nickname || !form.password || !form.password2 || !form.phone || !form.joinDate;
            if (requiredMissing) {
              setErrors({ name: '모든 필수 정보를 입력해주세요.' });
              return;
            }
            if (!form.consent) {
              setErrors({ consent: '개인정보 수집·이용에 동의해야 합니다.' });
              return;
            }
            setErrors({});
            const fd = new FormData(e.currentTarget as HTMLFormElement);
            // useFormState 디스패처는 반환값을 직접 주지 않으므로 상태 변화로 처리함
            signupAction(fd);
          }}
          className="space-y-3"
        >
          {(serverMessage || (signupState.message && signupState.message !== 'success')) && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {serverMessage || signupState.message}
            </div>
          )}
          {/* Removed buttonerType selection and adminConfirm field */}

          <div className="flex flex-col">
            {errors.name && <div className="text-xs text-red-500 mb-1">*** {errors.name}</div>}
            <input className="input" placeholder="이름" name="name" value={form.name} onChange={handleChange} />
            {errors.nickname && <div className="text-xs text-red-500 mb-1">*** {errors.nickname}</div>}
            <input className="input" placeholder="닉네임" name="nickname" value={form.nickname} onChange={handleChange} />
            {errors.password && <div className="text-xs text-red-500 mb-1">*** {errors.password}</div>}
            <input className="input" type="password" inputMode="numeric" maxLength={4} placeholder="비밀번호(숫자 4자리)" name="password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value.replace(/\D/g, '').slice(0, 4) }))} />
            {errors.password2 && <div className="text-xs text-red-500 mb-1">*** {errors.password2}</div>}
            <input className="input" type="password" inputMode="numeric" maxLength={4} placeholder="비밀번호 확인(숫자 4자리)" name="password2" value={form.password2} onChange={(e) => setForm(f => ({ ...f, password2: e.target.value.replace(/\D/g, '').slice(0, 4) }))} />
            {errors.phone && <div className="text-xs text-red-500 mb-1">*** {errors.phone}</div>}
            <input className="input" type="tel" placeholder="010-0000-0000" name="phoneNumber" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: formatPhone(e.target.value) }))} />

            <div className="flex items-baseline justify-between mb-1 mt-3">
              <button type="button" onClick={() => openPicker(joinDateRef)} className="text-sm font-medium text-ink text-left">
                입사일자
              </button>
            </div>
            {errors.joinDate && <div className="text-xs text-red-500 mb-1">*** {errors.joinDate}</div>}
            <input aria-label="입사일자" ref={joinDateRef} className="input" type="date" name="employmentStartDate" value={form.joinDate} onChange={(e) => setForm(f => ({ ...f, joinDate: e.target.value }))} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => history.back()} className="btn-ghost">
              취소
            </button>
            <SubmitButton />
          </div>
        </form>
      </div>
    </PageLayout>
  );
}
