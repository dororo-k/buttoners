"use client";

import React, { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { db } from '@/lib/firebaseClient';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function AdminPointsPolicy() {
  const [dailyGiftLimit, setDailyGiftLimit] = useState<number>(3000);
  const [monthlyGiftLimit, setMonthlyGiftLimit] = useState<number>(0);
  const [refundCooldownHours, setRefundCooldownHours] = useState<number>(0);
  const [reserveDefault, setReserveDefault] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'pointsPolicy'));
        if (snap.exists()) {
          const d = snap.data() as any;
          if (typeof d?.dailyGiftLimit === 'number') setDailyGiftLimit(d.dailyGiftLimit);
          if (typeof d?.monthlyGiftLimit === 'number') setMonthlyGiftLimit(d.monthlyGiftLimit);
          if (typeof d?.refundCooldownHours === 'number') setRefundCooldownHours(d.refundCooldownHours);
          if (typeof d?.reserveDefault === 'number') setReserveDefault(d.reserveDefault);
        }
      } catch {}
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'pointsPolicy'), {
        dailyGiftLimit: Number(dailyGiftLimit || 0),
        monthlyGiftLimit: Number(monthlyGiftLimit || 0),
        refundCooldownHours: Number(refundCooldownHours || 0),
        reserveDefault: Number(reserveDefault || 0),
        updatedAt: new Date(),
      }, { merge: true });
      try { notifications.show({ color: 'green', message: '저장되었습니다.' }); } catch {}
    } catch (e: any) {
      try { notifications.show({ color: 'red', message: e?.message || '저장 실패' }); } catch {}
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold text-ink mb-3">포인트 정책 설정</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <label className="flex items-center gap-2">일일 선물 한도
          <input type="number" className="input h-8" value={dailyGiftLimit} onChange={(e) => setDailyGiftLimit(Number(e.target.value || 0))} />
        </label>
        <label className="flex items-center gap-2">월 선물 한도
          <input type="number" className="input h-8" value={monthlyGiftLimit} onChange={(e) => setMonthlyGiftLimit(Number(e.target.value || 0))} />
        </label>
        <label className="flex items-center gap-2">환불 쿨다운(시간)
          <input type="number" className="input h-8" value={refundCooldownHours} onChange={(e) => setRefundCooldownHours(Number(e.target.value || 0))} />
        </label>
        <label className="flex items-center gap-2">여유 포인트 기본값
          <input type="number" className="input h-8" value={reserveDefault} onChange={(e) => setReserveDefault(Number(e.target.value || 0))} />
        </label>
      </div>
      <div className="mt-4 flex justify-end">
        <button className="btn-primary" onClick={save} disabled={saving}>{saving ? '저장 중…' : '저장'}</button>
      </div>
    </div>
  );
}
