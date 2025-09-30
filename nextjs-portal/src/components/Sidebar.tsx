'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Book,
  Sparkles,
  Gamepad2,
  Star,
  Calendar,
  MessageSquare,
  Settings,
  X,
  Megaphone,
} from 'lucide-react';

const navItems = [
  { href: '/notices', label: '공지사항', icon: Megaphone },
  { href: '/manuals', label: '매뉴얼', icon: Book },
  { href: '/cleaning', label: '청소', icon: Sparkles },
  { href: '/game', label: '게임', icon: Gamepad2 },
  { href: '/points', label: '포인트', icon: Star },
  { href: '/schedule', label: '일정', icon: Calendar },
  { href: '/board', label: '자유게시판', icon: MessageSquare },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-30 bg-black/60 transition-opacity md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-surface transition-transform ${
          isOpen ? 'translate-x-0 w-64' : '-translate-x-full'
        } md:relative md:w-[var(--sidebar-w-md)] md:translate-x-0 lg:w-[var(--sidebar-w-lg)]`}
      >
        <nav className="flex flex-1 flex-col items-start gap-1 p-2 px-3 pt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`group relative flex h-10 items-center justify-start rounded-lg transition-colors hover:bg-elev ${isActive ? 'bg-elev text-brand' : 'text-muted hover:text-ink'} w-full px-3 gap-3`}
                onClick={onClose}
                aria-label={item.label}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col items-start gap-1 p-2 px-3">
          <hr className="my-1 w-10 border-t border-border" />
          <Link href="/settings" className={`group relative flex h-10 items-center justify-start rounded-lg transition-colors hover:bg-elev ${pathname === '/settings' ? 'bg-elev text-brand' : 'text-muted hover:text-ink'} w-full px-3 gap-3`} onClick={onClose} aria-label="설정" >
            <Settings className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">설정</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
