"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/components/providers/StoreProvider';
import { subscribeUserTransactions, type PointTransaction } from '../services/pointTransactionsRepo';

function tsOf(tx?: PointTransaction): number | null {
  if (!tx) return null;
  const c = (tx as any).createdAt;
  if (!c) return null;
  if (typeof c.toDate === 'function') return c.toDate().getTime();
  const t = Date.parse(String(c));
  return Number.isFinite(t) ? t : null;
}

export default function PointsGiftIndicator() {
  const user = useAppStore('staffSession', (s) => s.currentUser);
  const [txs, setTxs] = useState<PointTransaction[]>([]);
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);

  // Load last seen from localStorage per-user
  useEffect(() => {
    if (!user?.uid) return;
    const raw = localStorage.getItem(`gift-seen-at:${user.uid}`);
    setDismissedAt(raw ? Number(raw) : null);
  }, [user?.uid]);

  // Subscribe to user's transactions
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeUserTransactions(user.uid, setTxs);
    return () => { try { unsub && unsub(); } catch {} };
  }, [user?.uid]);

  const latestGift = useMemo(() => txs.filter((t) => t.type === 'gift-received')[0] || null, [txs]);
  const latestGiftTs = tsOf(latestGift);
  const hasUnread = !!(latestGiftTs && (!dismissedAt || latestGiftTs > dismissedAt));

  if (!user) return null;

  const label = latestGift ? `${latestGift.itemsSummary || '누군가'}님의 선물 ${Math.abs(latestGift.amount).toLocaleString()}P` : '새 선물 없음';

  const onClick = () => {
    if (!user?.uid) return;
    const now = latestGiftTs || Date.now();
    localStorage.setItem(`gift-seen-at:${user.uid}`, String(now));
    setDismissedAt(now);
  };

  return (
    <div className="relative group select-none">
      <button
        type="button"
        onClick={onClick}
        className="relative px-2 py-1 text-sm text-muted hover:text-ink rounded-md"
        aria-label="포인트 알림"
      >
        포인트
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 inline-block w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-panel" />
        )}
      </button>
      {hasUnread && (
        <div className="absolute z-50 hidden group-hover:block text-xs bg-elev text-ink px-2 py-1 rounded shadow border border-border whitespace-nowrap -left-2 translate-y-1">
          {label}
        </div>
      )}
    </div>
  );
}

