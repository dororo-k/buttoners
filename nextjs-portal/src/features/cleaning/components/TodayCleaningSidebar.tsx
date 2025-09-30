"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { subscribeCleaningTasks, updateCleaningTask } from '../services/cleaningRepo';
import { addCleaningLog, deleteCleaningLog, subscribeCleaningLogs, type CleaningLogDoc } from '../services/cleaningLogsRepo';
import type { CleaningTask } from '../types';
import { useAppStore } from '@/components/providers/StoreProvider';

export default function TodayCleaningSidebar() {
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [logs, setLogs] = useState<CleaningLogDoc[]>([]);
  const currentUser = useAppStore('staffSession', (s: any) => (s as any).currentUser);

  useEffect(() => {
    const unsub = subscribeCleaningTasks(setTasks);
    const unsub2 = subscribeCleaningLogs(setLogs);
    return () => {
      try { unsub && unsub(); } catch {}
      try { unsub2 && unsub2(); } catch {}
    };
  }, []);

  const today = useMemo(() => new Date(), []);
  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const dateISO = (d: Date) => d.toISOString().split('T')[0];

  const logsByTask = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const l of logs) {
      if (!l.taskId || !l.at) continue;
      const iso = l.at.split('T')[0];
      const arr = map.get(l.taskId) || [];
      arr.push(iso);
      map.set(l.taskId, arr);
    }
    for (const [k, arr] of map.entries()) arr.sort();
    return map;
  }, [logs]);

  const latestScheduledOnOrBefore = (task: CleaningTask, day: Date): Date | null => {
    const interval = task.interval;
    if (!interval) return null;
    const d0 = startOfDay(day);
    if (interval.type === 'daily') return d0;
    if (interval.type === 'weekly') {
      const target = interval.weekday ?? 0;
      const cur = new Date(d0);
      while (cur.getDay() !== target) cur.setDate(cur.getDate() - 1);
      return cur;
    }
    if (interval.type === 'everyN') {
      const n = interval.n || 0;
      if (n <= 0) return null;
      let anchor: Date | null = null;
      if (task.lastDoneAt) {
        let last: Date | null = null;
        if (typeof task.lastDoneAt === 'number') last = new Date(task.lastDoneAt);
        else if (typeof task.lastDoneAt === 'string') last = new Date(task.lastDoneAt);
        if (last) {
          last = startOfDay(last);
          anchor = addDays(last, n);
        }
      }
      if (!anchor) anchor = d0; // fallback: today as first schedule baseline
      let cur = new Date(anchor);
      if (cur > d0) return null;
      let prev = new Date(cur);
      while (cur <= d0) {
        prev = new Date(cur);
        cur = addDays(cur, n);
      }
      return prev;
    }
    return null;
  };

  const displayToday = useMemo(() => {
    // Build union: due (not done) + done today
    const map = new Map<string, { task: CleaningTask; baseISO?: string; delayDays: number; myLog?: CleaningLogDoc; isDoneToday: boolean }>();
    for (const t of tasks) {
      if (t.active === false) continue;
      const base = latestScheduledOnOrBefore(t, today);
      if (!base) continue;
      const baseISO = dateISO(base);
      const arr = logsByTask.get(t.id) || [];
      const hasDone = arr.some((iso) => iso >= baseISO && iso <= todayISO);
      const my = logs.find((l) => (l.taskId === t.id || l.taskTitle === t.title) && l.at?.startsWith(todayISO) && l.doneBy === (currentUser?.nickname || currentUser?.name || currentUser?.email || 'unknown'));
      const isDoneToday = !!my;
      if (!hasDone) {
        const delayDays = Math.max(0, Math.floor((startOfDay(today).getTime() - startOfDay(base).getTime()) / 86400000));
        map.set(t.id, { task: t, baseISO, delayDays, myLog: my, isDoneToday });
      } else if (isDoneToday) {
        // Done today: keep visible with green
        map.set(t.id, { task: t, baseISO, delayDays: 0, myLog: my, isDoneToday: true });
      }
    }
    const arr = Array.from(map.values());
    return arr.sort((a, b) => (b.delayDays - a.delayDays) || a.task.title.localeCompare(b.task.title));
  }, [tasks, logsByTask, logs, today, todayISO, currentUser]);

  const toggle = async (entry: { task: CleaningTask; myLog?: CleaningLogDoc }) => {
    const meNow = currentUser?.nickname || currentUser?.name || currentUser?.email || 'unknown';
    if (!entry.myLog) {
      try {
        await addCleaningLog(entry.task.id, entry.task.title, meNow);
        const nowIso = new Date().toISOString();
        await updateCleaningTask(entry.task.id, { lastDoneAt: nowIso } as any);
      } catch {}
    } else {
      try {
        await deleteCleaningLog(entry.myLog.id);
        const remaining = logs.filter((l) => l.taskId === entry.task.id && l.id !== entry.myLog!.id && l.at);
        const latest = remaining.sort((a, b) => (a.at > b.at ? -1 : 1))[0];
        await updateCleaningTask(entry.task.id, { lastDoneAt: latest ? latest.at : null } as any);
      } catch {}
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-ink mb-3">오늘의 청소 업무</h3>
      {displayToday.length === 0 ? (
        <div className="text-sm text-muted">오늘 해야 할 업무가 없습니다.</div>
      ) : (
        <ul className="space-y-2 max-h-64 overflow-auto pr-1">
          {displayToday.map((e) => (
            <li key={e.task.id} className={`flex items-center justify-between gap-2 ${e.delayDays > 0 && !e.isDoneToday ? 'bg-orange-400/10 rounded px-2 py-1' : ''}` }>
              <div className="min-w-0">
                <div className={`text-sm font-medium ${e.isDoneToday ? 'text-green-700' : 'text-ink'} truncate`} title={e.task.title}> {e.isDoneToday ? '✓ ' : ''}{e.task.title}</div>
                {e.delayDays > 0 && !e.isDoneToday && (
                  <div className="text-[11px] text-red-600">지연 {e.delayDays}일</div>
                )}
              </div>
              <button
                className={`text-xs rounded px-2 py-1 whitespace-nowrap transition ${e.myLog
                  ? 'bg-green-100 text-green-800 ring-1 ring-green-400 hover:ring-green-500 hover:brightness-110'
                  : 'bg-elev text-ink ring-1 ring-brand/60 hover:bg-white/10 hover:ring-brand hover:brightness-110'}`}
                onClick={() => toggle(e)}
                title={e.myLog ? '완료 취소' : '완료'}
              >
                {e.myLog ? '✓ 완료' : '완료'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
