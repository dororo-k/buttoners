"use client";

import React from 'react';
import { useAppStore } from '@/components/providers/StoreProvider';

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export default function AdminOnly({ children, fallback = null }: Props) {
  const currentUser = useAppStore('staffSession', (s) => s.currentUser);
  const isAdmin = currentUser?.position === 'admin';
  if (!isAdmin) return <>{fallback}</>;
  return <>{children}</>;
}


