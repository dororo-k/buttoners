"use client";

import React, { useEffect, useState } from 'react';
import { subscribeAllTransactions, type PointTransaction } from '@/features/points/services/pointTransactionsRepo';

export default function AdminPointTransactions() {
  const [txs, setTxs] = useState<PointTransaction[]>([]);

  useEffect(() => {
    const unsub = subscribeAllTransactions(setTxs);
    return () => { try { unsub && unsub(); } catch {} };
  }, []);

  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold text-ink mb-3">포인트 사용내역</h3>
      <div className="grid grid-cols-[160px_1fr_120px_1fr] text-xs font-semibold text-muted border-b border-border pb-2 mb-2">
        <div>사용자</div>
        <div>구매내역</div>
        <div className="text-right">차감 포인트</div>
        <div>비고</div>
      </div>
      <div className="max-h-[60vh] overflow-auto space-y-2">
        {txs.length === 0 && <div className="text-sm text-muted">사용내역이 없습니다.</div>}
        {txs.map((tx) => {
          const name = tx.userName || tx.userNickname || tx.uid;
          const isRefund = tx.type === 'refund';
          const deltaText = `${isRefund ? '+' : '-'}${Math.abs(tx.amount).toLocaleString()}`;
          return (
            <div key={tx.id} className="grid grid-cols-[160px_1fr_120px_1fr] items-start text-xs">
              <div className="pr-2 truncate" title={name}>{name}</div>
              <div className="pr-2 break-words">{tx.itemsSummary || '-'}</div>
              <div className={`text-right tabular-nums ${isRefund ? 'text-green-600' : 'text-red-600'}`}>{deltaText}</div>
              <div className="pr-2 break-words">{tx.reason || (tx.refunded ? '환불 완료' : '-')}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

