'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { PreviewSidebarProvider, usePreviewSidebar } from '@/contexts/PreviewSidebarContext';
import TodayCleaningSidebar from '@/features/cleaning/components/TodayCleaningSidebar';

const AppFooter = () => (
  <footer className="text-center p-4 text-xs text-muted border-t border-border">
    (c) {new Date().getFullYear()} Redbutton Hwajeong. All rights reserved by 차성환.
  </footer>
);

// This component will now be the child of PreviewSidebarProvider
function AppShellContent({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { isRightSidebarOpen, setRightSidebarOpen } = usePreviewSidebar();

  return (
    <div className="flex min-h-screen w-full bg-surface flex-col overflow-x-hidden">
      <div className="sticky top-0 z-50">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
      </div>
      <div className="flex flex-1 md:gap-4">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:top-2 focus:left-2 focus:p-2 focus:bg-brand focus:text-white focus:rounded-md">
          Skip to main content
        </a>
        <div className="flex flex-1 flex-col min-h-0">
          <div className="flex-1 overflow-y-auto flex flex-col">
            <main id="main-content" className="flex-1 p-4 max-w-[var(--container)] mx-auto w-full">
              {children}
            </main>
          </div>
        </div>
        {/* Right Sidebar */}
        <aside
          className={`fixed inset-y-0 right-0 z-40 flex flex-col border-l border-border bg-surface transition-transform ${
            isRightSidebarOpen ? 'translate-x-0 w-72' : 'translate-x-full'
          } md:relative md:translate-x-0 md:w-0 lg:w-72`}
        >
          <div className="p-4 space-y-6">
            {/* Close button for mobile */}
            <div className="flex justify-end md:hidden">
              <button onClick={() => setRightSidebarOpen(false)} className="btn-ghost text-sm">닫기</button>
            </div>

            {/* Today Cleaning (live) */}
            <div>
              <TodayCleaningSidebar />
            </div>

            {/* Dummy Section 2: Game Management */}
            <div>
              <h3 className="text-lg font-semibold text-ink mb-3">게임 관리</h3>
              <div className="h-32 bg-panel rounded-md flex items-center justify-center text-muted text-sm p-4">보수 필요 게임 목록</div>
            </div>
          </div>
        </aside>
      </div>
      <AppFooter />
    </div>
  );
}

// The main AppShell component will now just render the provider
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <PreviewSidebarProvider>
      <AppShellContent>{children}</AppShellContent>
    </PreviewSidebarProvider>
  );
}
