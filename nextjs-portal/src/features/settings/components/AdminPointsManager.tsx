"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { notifications } from '@mantine/notifications';
import useStaffStore from '@/features/staff/store/useStaffStore';
import type { Account } from '@/types';

export default function AdminPointsManager() {
  const staffStore = useStaffStore();
  const [members, setMembers] = useState<Account[]>([]);
  const [hours, setHours] = useState<Record<string, number>>({});
  const [reserve, setReserve] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const list = await staffStore.getStaffList();
        setMembers(list.filter((m) => m.position !== 'admin'));
      } catch (e: any) {
        setError(e?.message || '회원 불러오기 실패');
      } finally {
        setLoading(false);
      }
    })();
  }, [staffStore]);

  const pool = useMemo(() => {
    const n = members.length;
    if (n >= 10 && n <= 13) return 220000;
    if (n >= 14 && n <= 17) return 280000;
    if (n >= 18 && n <= 22) return 330000;
    if (n === 23) return 380000;
    return 0;
  }, [members.length]);

  const totalHours = useMemo(() => Object.values(hours).reduce((s, v) => s + (Number(v) || 0), 0), [hours]);
  const available = Math.max(0, pool - Math.max(0, reserve));
  const floor500 = (x: number) => Math.floor(x / 500) * 500;

  const preview = useMemo(() => {
    const map = new Map<string, number>();
    if (available <= 0 || totalHours <= 0) return map;
    for (const m of members) {
      const h = Number(hours[m.uid] || 0);
      const share = available * (h / totalHours);
      map.set(m.uid, floor500(share));
    }
    return map;
  }, [members, hours, available, totalHours]);

  const [adj, setAdj] = useState<Record<string, number>>({});

  const adjust = async (uid: string, sign: 1 | -1) => {
    const delta = Math.abs(Number(adj[uid] || 0)) * sign;
    if (!delta) return;
    const reason = prompt('사유를 입력하세요') || '';
    const res = await fetch('/api/admin/points/adjust', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uid, delta, reason }) });
    if (!res.ok) { try { notifications.show({ color: 'red', message: '조정 실패' }); } catch {} }
  };

  const applyDistribute = async () => {
    const users = members.map((m) => ({ uid: m.uid, hours: Number(hours[m.uid] || 0) })).filter((u) => u.hours > 0);
    const res = await fetch('/api/admin/points/distribute', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reservePoints: Number(reserve || 0), users }) });
    const j = await res.json();
    if (!res.ok) { try { notifications.show({ color: 'red', message: j?.error || '배분 실패' }); } catch {} }
    else { try { notifications.show({ color: 'green', message: '배분 완료' }); } catch {} }
  };

  if (loading) return <div className="text-sm text-muted">불러오는 중…</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;

  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold text-ink mb-3">월간 포인트 배분/초기화</h3>
      <div className="flex items-center gap-3 text-sm mb-3">
        <div>인원: <span className="font-semibold">{members.length}</span></div>
        <div>총 포인트(규칙): <span className="font-semibold tabular-nums">{pool.toLocaleString()} P</span></div>
        <div className="flex items-center gap-1">여유 포인트: <input type="number" className="input h-7 w-28" value={reserve} onChange={(e) => setReserve(Number(e.target.value || 0))} /></div>
        <div>배분 가능: <span className="font-semibold tabular-nums">{available.toLocaleString()} P</span></div>
        <div>총 근무시간: <span className="font-semibold">{totalHours}</span></div>
      </div>
      <div className="grid grid-cols-[1fr_120px_140px_160px_160px] text-xs font-semibold text-muted border-b border-border pb-2 mb-2">
        <div>사용자</div>
        <div className="text-center">근무시간</div>
        <div className="text-right">미리보기</div>
        <div className="text-center">증여/차감</div>
        <div className="text-center">조정</div>
      </div>
      <div className="max-h-[60vh] overflow-auto space-y-2">
        {members.map((m) => {
          const pv = preview.get(m.uid) || 0;
          return (
            <div key={m.uid} className="grid grid-cols-[1fr_120px_140px_160px_160px] items-center text-xs">
              <div className="pr-2 truncate" title={`${m.name}(${m.nickname})`}>{m.name}({m.nickname})</div>
              <div className="text-center"><input type="number" className="input h-7 w-24" value={hours[m.uid] || ''} onChange={(e) => setHours((h) => ({ ...h, [m.uid]: Number(e.target.value || 0) }))} /></div>
              <div className="text-right tabular-nums font-semibold">{pv.toLocaleString()} P</div>
              <div className="text-center"><input type="number" className="input h-7 w-28" value={adj[m.uid] || ''} onChange={(e) => setAdj((a) => ({ ...a, [m.uid]: Number(e.target.value || 0) }))} placeholder="포인트" /></div>
              <div className="text-center flex items-center justify-center gap-2">
                <button className="btn-ghost btn-xs" onClick={() => adjust(m.uid, 1)}>증여</button>
                <button className="btn-ghost btn-xs" onClick={() => adjust(m.uid, -1)}>차감</button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex justify-end">
        <button className="btn-primary" onClick={applyDistribute}>적용</button>
      </div>
    </div>
  );
}
