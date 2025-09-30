import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/AppShell';
import { StoreProvider } from '@/components/providers/StoreProvider';
import QueryProvider from '@/components/providers/QueryProvider'; // 1. QueryProvider import
import { getAuthenticatedUser } from '@/lib/session'; // Import server-side auth utility
import UiProvider from '@/components/providers/UiProvider';
import ChunkErrorReload from '@/components/ChunkErrorReload';
import DebugClient from '@/components/DebugClient';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Buttoners Portal',
  description: 'Buttoners internal portal for staff and management',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialCurrentUser = await getAuthenticatedUser(); // Fetch user on server

  return (
    <html lang="ko">
      <body className={inter.className}>
        <UiProvider>
          <ChunkErrorReload />
          <DebugClient />
          {/* 2. QueryProvider로 감싸기 */}
          <QueryProvider>
            <StoreProvider initialCurrentUser={initialCurrentUser}> {/* Pass initialCurrentUser */}
              <AppShell>{children}</AppShell>
            </StoreProvider>
          </QueryProvider>
        </UiProvider>
      </body>
    </html>
  );
}
