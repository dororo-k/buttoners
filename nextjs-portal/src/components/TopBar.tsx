﻿'use client';

import React, { useEffect } from 'react';
import Link, { type LinkProps } from 'next/link';
import { Menu, User, LogIn, LogOut, Settings } from 'lucide-react';
import { useAppStore } from '@/components/providers/StoreProvider';
import { useStaffAuthForm } from '@/features/staff/hooks/useStaffAuthForm';
import { useFormStatus } from 'react-dom';
import { UserStatusBadge } from './UserStatusBadge';
import { useRouter } from 'next/navigation';

interface TopBarProps {
  onMenuClick: () => void;
}

function SubmitLoginButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn-primary h-8 px-3 text-sm flex items-center gap-1.5 cursor-pointer active:scale-[.98] transition-transform"
      disabled={pending}
    >
      <LogIn className="h-4 w-4" />
      {pending ? '로그인 중…' : '로그인'}
    </button>
  );
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const currentUser = useAppStore('staffSession', (state) => state.currentUser);

  return (
    <div className="flex h-16 w-full items-center px-4 md:px-6 bg-panel/80 backdrop-blur-sm border-b border-border">
      {/* Mobile Menu Button */}
      <button onClick={onMenuClick} className="rounded-md p-2 text-muted hover:text-ink md:hidden" aria-label="Open menu">
        <Menu className="h-6 w-6" />
      </button>

      {/* Desktop Home/Brand Link */}
      <Link href="/" className="hidden md:flex items-center gap-2.5 group">
        <div className="flex items-center justify-center rounded-full bg-panel p-2 transition-colors group-hover:bg-elev">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-brand"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        </div>
        <span className="font-semibold text-lg text-ink">화정 버트너스</span>
      </Link>

      <div className="flex items-center gap-4 ml-auto">
        {currentUser ? (
          <LoggedInUser currentUser={currentUser} />
        ) : (
          <LoginForm />
        )}
      </div>
    </div>
  );
};

function SubmitLogoutButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn-ghost text-sm text-muted hover:text-ink flex items-center gap-1.5 cursor-pointer active:scale-[.98] transition-transform"
      disabled={pending}
      aria-label="로그아웃"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">{pending ? '로그아웃 중…' : '로그아웃'}</span>
    </button>
  );
}

const LoggedInUser = ({ currentUser }: { currentUser: any }) => {
  const router = useRouter();
  const setCurrentUser = useAppStore('staffSession', (s: any) => (s as any).setCurrentUser);

  const handleLogout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Optimistic: 즉시 UI 갱신
      setCurrentUser(null);
      // 1) 서버 세션 쿠키 삭제
      await fetch('/api/session', { method: 'DELETE' });
      // 2) 클라이언트 Firebase에서 로그아웃 (best-effort)
      try {
        const { auth } = await import('@/lib/firebaseClient');
        const { signOut } = await import('firebase/auth');
        await signOut(auth);
      } catch {}
      // 3) 서버 컴포넌트 상태 강제 새로고침(SSR 반영)
      router.refresh();
    } catch (err) {
      // no-op
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <User className="h-5 w-5 text-muted" />
          <span className="text-sm font-semibold text-ink">{`${currentUser.name}(${currentUser.nickname})`}</span>
        </div>
        <UserStatusBadge currentUser={currentUser} />
      </div>
      <ActionButton href="/settings" icon={Settings} label="설정" />
      <form onSubmit={handleLogout}>
        <SubmitLogoutButton />
      </form>
    </>
  );
};

const LoginForm = () => {
  const { form, handleChange, loginState, loginActionForm } = useStaffAuthForm('login');
  const router = useRouter();
  const setCurrentUser = useAppStore('staffSession', (s: any) => (s as any).setCurrentUser);

  useEffect(() => {
    // 서버 액션에서 커스텀 토큰을 받으면 클라이언트에서 Firebase로 로그인 후 세션 쿠키 설정
    const performSessionLogin = async () => {
      if (loginState && loginState.message === 'success' && (loginState as any).token) {
        try {
          const { auth } = await import('@/lib/firebaseClient');
          const { signInWithCustomToken } = await import('firebase/auth');
          const token = (loginState as any).token as string;
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
          router.refresh();
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Client session login failed:', err);
        }
      }
    };
    performSessionLogin();
  }, [loginState]);

  return (
    <form action={loginActionForm} className="flex items-center gap-2 whitespace-nowrap">
      {loginState.message && loginState.message !== 'success' && <div className="text-xs text-red-500 mr-1">{loginState.message}</div>}
      <input name="name" value={form.name} onChange={handleChange} className="input h-8 text-sm w-[10ch]" placeholder="닉네임" autoComplete="username" />
      <input name="password" value={form.password} onChange={handleChange} className="input h-8 text-sm w-[12ch]" type="password" placeholder="비밀번호" autoComplete="current-password" />
      <SubmitLoginButton />
      <Link href="/signup" className="btn-ghost h-8 px-3 text-sm">회원가입</Link>
    </form>
  );
};

const ActionButton = ({ icon: Icon, label, ...props }: { icon: React.ElementType; label: string } & (({ href: LinkProps['href']; type?: never; onClick?: never; }) | ({ href?: never; type: 'submit' | 'button'; onClick?: () => void; }))) => {
  const commonProps = {
    className: "btn-ghost text-sm text-muted hover:text-ink flex items-center gap-1.5 cursor-pointer active:scale-[.98] transition-transform",
  } as const;

  const content = (
    <>
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </>
  );

  if (props.href) {
    return <Link href={props.href} {...commonProps}>{content}</Link>;
  }

  return <button type={props.type} onClick={props.onClick} {...commonProps}>{content}</button>;
};

export default TopBar;
