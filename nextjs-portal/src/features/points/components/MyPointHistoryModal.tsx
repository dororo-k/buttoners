"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { useAppStore } from '@/components/providers/StoreProvider';
import { subscribeUserTransactions, type PointTransaction } from '../services/pointTransactionsRepo';

export default function MyPointHistoryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const currentUser = useAppStore('staffSession', (s) => s.currentUser);
  const [txs, setTxs] = useState<PointTransaction[]>([]);
  const [reasonMap, setReasonMap] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !currentUser?.uid) return;
    const unsub = subscribeUserTransactions(currentUser.uid, setTxs);
    return () => { try { unsub && unsub(); } catch {} };
  }, [open, currentUser?.uid]);

  const rows = useMemo(() => txs, [txs]);

  const requestRefund = async (purchaseTx: PointTransaction) => {
    const reason = reasonMap[purchaseTx.id]?.trim();
    if (!reason) { try { notifications.show({ color: 'red', message: '환불 사유를 입력해 주세요.' }); } catch {}; return; }
    setSubmittingId(purchaseTx.id);
    try {
      const resp = await fetch('/api/points/refund', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ purchaseId: purchaseTx.id, amount: Math.abs(purchaseTx.amount), reason }) });
      const j = await resp.json();
      if (!resp.ok) { try { notifications.show({ color: 'red', message: j?.error || '환불 처리 실패' }); } catch {} } else { try { notifications.show({ color: 'green', message: '환불이 접수되었습니다.' }); } catch {} }
    } catch (e: any) {
      try { notifications.show({ color: 'red', message: e?.message || '환불 처리 오류' }); } catch {}
    } finally {
      setSubmittingId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-panel rounded-lg shadow-xl w-full max-w-2xl p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-ink">내 구매내역</h3>
          <button className="btn-ghost btn-xs" onClick={onClose}>닫기</button>
        </div>
        <div className="grid grid-cols-[1fr_1fr_100px_1fr_80px] text-xs font-semibold text-muted border-b border-border pb-2 mb-2">
          <div>일시</div>
          <div>구매내역</div>
          <div className="text-right">포인트</div>
          <div>비고</div>
          <div className="text-center">환불</div>
        </div>
        <div className="max-h-[60vh] overflow-auto space-y-2">
          {rows.length === 0 && <div className="text-sm text-muted">구매 내역이 없습니다.</div>}
          {rows.map((tx) => {
            const isRefund = tx.type === 'refund';
            const dt = tx.createdAt?.toDate ? tx.createdAt.toDate() : (tx.createdAt ? new Date(tx.createdAt) : null);
            const when = dt ? new Date(dt).toLocaleString() : '';
            return (
              <div key={tx.id} className="grid grid-cols-[1fr_1fr_100px_1fr_80px] items-start text-xs">
                <div className="pr-2">{when}</div>
                <div className="pr-2 break-words">{tx.itemsSummary || '-'}</div>
                <div className={`text-right tabular-nums ${isRefund ? 'text-green-600' : 'text-red-600'}`}>{isRefund ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()}</div>
                <div className="pr-2">
                  {isRefund ? (tx.reason || '-') : (
                    <input
                      type="text"
                      placeholder="환불 사유"
                      className="input h-7 text-xs"
                      value={reasonMap[tx.id] || ''}
                      onChange={(e) => setReasonMap((m) => ({ ...m, [tx.id]: e.target.value }))}
                      disabled={!!tx.refunded}
                    />
                  )}
                </div>
                <div className="text-center">
                  {tx.type === 'purchase' && !tx.refunded ? (
                    <button className="text-xs text-blue-600 hover:underline disabled:text-muted" disabled={submittingId === tx.id} onClick={() => requestRefund(tx)}>환불</button>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
