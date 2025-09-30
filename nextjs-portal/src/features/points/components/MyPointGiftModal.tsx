"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { useAppStore } from '@/components/providers/StoreProvider';
import useStaffStore from '@/features/staff/store/useStaffStore';
import { subscribeUserTransactions, type PointTransaction } from '../services/pointTransactionsRepo';
import { db } from '@/lib/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';

export default function MyPointGiftModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const currentUser = useAppStore('staffSession', (s) => s.currentUser);
  const setCurrentUser = useAppStore('staffSession', (s: any) => (s as any).setCurrentUser);
  const staffStore = useStaffStore();
  const [members, setMembers] = useState<any[]>([]);
  const [toUid, setToUid] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [txs, setTxs] = useState<PointTransaction[]>([]);
  const [dailyLimit, setDailyLimit] = useState<number>(3000);

  // Load policy
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'pointsPolicy'));
        if (snap.exists()) {
          const d = snap.data() as any;
          if (typeof d?.dailyGiftLimit === 'number') setDailyLimit(d.dailyGiftLimit);
        }
      } catch {}
    })();
  }, []);

  // Subscribe to own transactions to compute today's remaining limit
  useEffect(() => {
    if (!open || !currentUser?.uid) return;
    const unsub = subscribeUserTransactions(currentUser.uid, setTxs);
    return () => { try { unsub && unsub(); } catch {} };
  }, [open, currentUser?.uid]);

  const sentToday = useMemo(() => {
    const start = new Date(); start.setHours(0,0,0,0);
    return txs
      .filter((t) => t.type === 'gift-sent' && (() => { const c:any = t.createdAt; const dt = c?.toDate ? c.toDate() : (c ? new Date(c) : null); return dt && dt >= start; })())
      .reduce((s, t) => s + Math.abs(Number(t.amount || 0)), 0);
  }, [txs]);
  const remainingToday = Math.max(0, dailyLimit - sentToday);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const list = await staffStore.getStaffList();
      setMembers(list.filter((m) => m.uid !== currentUser?.uid));
    })();
  }, [open, staffStore, currentUser?.uid]);

  const canSubmit = useMemo(() => open && !!toUid && amount > 0 && amount <= remainingToday && !!currentUser, [open, toUid, amount, remainingToday, currentUser]);

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const prevPoints = currentUser?.points ?? 0;
    try {
      // 낙관적 포인트 반영: 선물자는 즉시 차감 표시
      if (currentUser) setCurrentUser({ ...currentUser, points: prevPoints - amount });

      const idem = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`;
      const resp = await fetch('/api/points/gift', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': idem }, body: JSON.stringify({ toUid, amount, note }) });
      const j = await resp.json();
      if (!resp.ok) {
        // 롤백
        if (currentUser) setCurrentUser({ ...currentUser, points: prevPoints });
        try { notifications.show({ color: 'red', message: j?.error || '포인트 선물 실패' }); } catch {}
        return;
      }
      // Refresh current user points in client store
      if (currentUser) setCurrentUser({ ...currentUser, points: j.newPoints });
      try { notifications.show({ color: 'green', message: '포인트를 선물했습니다.' }); } catch {}
      onClose();
      setToUid(''); setAmount(0); setNote('');
    } catch (e: any) {
      // 롤백
      if (currentUser) setCurrentUser({ ...currentUser, points: prevPoints });
      try { notifications.show({ color: 'red', message: e?.message || '오류' }); } catch {}
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-panel rounded-lg shadow-xl w-full max-w-md p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-ink">포인트 선물하기</h3>
          <button className="btn-ghost btn-xs" onClick={onClose}>닫기</button>
        </div>
      <div className="space-y-3 text-sm">
          <div className="text-xs text-muted">오늘 남은 선물 한도 {dailyLimit.toLocaleString()}P 중 <span className={remainingToday===0?'text-red-600':'text-ink'}>{remainingToday.toLocaleString()}P</span></div>
          <div>
            <label className="meta">받는 사람</label>
            <select className="input" value={toUid} onChange={(e) => setToUid(e.target.value)}>
              <option value="">선택</option>
              {members.map((m) => (
                <option key={m.uid} value={m.uid}>{m.name}({m.nickname})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="meta">포인트</label>
            <input type="number" className="input" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value || 0))} placeholder="예: 500" max={remainingToday} />
            {amount > remainingToday && (<div className="text-[11px] text-red-600 mt-1">오늘 남은 한도를 초과했습니다.</div>)}
          </div>
          <div>
            <label className="meta">메시지(선택)</label>
            <input type="text" className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="축하/감사 메시지 등" />
          </div>
          <div className="flex justify-end">
            <button className="btn-primary" disabled={!canSubmit || submitting} onClick={submit}>{submitting ? '전송 중…' : '선물하기'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
