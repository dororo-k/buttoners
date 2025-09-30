// src/features/cleaning/components/CleaningCalendar.tsx
import type { ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { CleaningTask } from '../types';
import { useAppStore } from '@/components/providers/StoreProvider';
import { subscribeCleaningTasks } from '../services/cleaningRepo';
import { addCleaningLog, subscribeCleaningLogs, deleteCleaningLog, type CleaningLogDoc, addCleaningLogAt } from '../services/cleaningLogsRepo';
import { updateCleaningTask } from '../services/cleaningRepo';
import CleaningLogsModal from './CleaningLogsModal';

type Props = {
  demoTasks?: CleaningTask[];
  readOnly?: boolean;
};

const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토'];

const CleaningCalendar: React.FC<Props> = ({ demoTasks }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hover, setHover] = useState<{ day: string; x: number; y: number } | null>(null);
  const [liveTasks, setLiveTasks] = useState<CleaningTask[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const currentUser = useAppStore('staffSession', (s: any) => (s as any).currentUser);
  const [overBadge, setOverBadge] = useState(false);
  const [logsModalDate, setLogsModalDate] = useState<string | null>(null);
  const [dueModal, setDueModal] = useState<{ date: string; items: Array<{ id: string; title: string }> } | null>(null);

  // 구독: 데모가 없을 때는 라이브 태스크로 예정 작업 계산
  useEffect(() => {
    if (demoTasks && demoTasks.length) return;
    const unsub = subscribeCleaningTasks(setLiveTasks);
    return () => {
      try { unsub && unsub(); } catch {}
    };
  }, [demoTasks]);

  // 구독: 공용 완료 로그 (Firestore)
  useEffect(() => {
    const unsub = subscribeCleaningLogs(setLogs);
    return () => {
      try { unsub && unsub(); } catch {}
    };
  }, []);
  const [logs, setLogs] = useState<CleaningLogDoc[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = useMemo(() => new Date(year, month, 1), [year, month]);
  const lastDayOfMonth = useMemo(() => new Date(year, month + 1, 0), [year, month]);
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // 해당 월의 모든 날짜
  const daysInMonth = useMemo(() => {
    const arr: Date[] = [];
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      arr.push(new Date(year, month, day));
    }
    return arr;
  }, [year, month, lastDayOfMonth]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // 비어있는 앞칸 + 날짜 칸
  const calendarDays = useMemo(() => {
    const cells: ReactElement[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      cells.push(<div key={`empty-${i}`} className="border-t border-r border-border" />);
    }

    // Carryover support: group logs by task (date-only) and compute due per day
    const dateISO = (d: Date) => d.toISOString().split('T')[0];
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
    const source: CleaningTask[] = (demoTasks && demoTasks.length) ? demoTasks : liveTasks;

    const logsByTask = new Map<string, string[]>();
    for (const l of logs) {
      if (!l.taskId || !l.at) continue;
      const iso = l.at.split('T')[0];
      const arr = logsByTask.get(l.taskId) || [];
      arr.push(iso);
      logsByTask.set(l.taskId, arr);
    }
    for (const [k, arr] of logsByTask.entries()) {
      arr.sort();
      logsByTask.set(k, arr);
    }

    const latestScheduledOnOrBefore = (task: CleaningTask, day: Date): Date | null => {
      const interval = task.interval;
      if (!interval) return null;
      const d0 = startOfDay(day);
      const today0 = startOfDay(new Date());
      if (interval.type === 'daily') {
        // Daily: if never done, first schedule is today; before today return null (not needed for current month view)
        return d0;
      }
      if (interval.type === 'weekly') {
        const target = interval.weekday ?? 0;
        if (!task.lastDoneAt) {
          // First schedule is the next target weekday from today
          const first = new Date(today0);
          while (first.getDay() !== target) first.setDate(first.getDate() + 1);
          if (d0 < first) return null; // do not show before first schedule arrives
        }
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
        if (!anchor) {
          // First schedule if never done: today + n (not from month start) so it does not backfill earlier days
          anchor = addDays(today0, n);
        }
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

    daysInMonth.forEach((day) => {
      const dayString = day.toISOString().split('T')[0];
      const dayLogs = logs.filter((log) => log.at && log.at.startsWith(dayString));
      // Build due list for this day with carryover rule
      const dueItems: Array<{ title: string; id: string }> = [];
      if (source && source.length) {
        for (const t of source) {
          if (t.active === false) continue;
          const s = latestScheduledOnOrBefore(t, day);
          if (!s) continue;
          const sIso = dateISO(s);
          const arr = logsByTask.get(t.id) || [];
          const hasDone = arr.some((iso) => iso >= sIso && iso <= dayString);
          const isScheduledDay = sIso === dayString;
          const day0 = startOfDay(day);
          const today0 = startOfDay(new Date());
          if (day0 <= today0) {
            // 과거/오늘: 미완료면 캐리오버로 표시
            if (!hasDone) dueItems.push({ title: t.title, id: t.id });
          } else {
            // 미래: 당일이 정확한 예정일일 때만 표시
            if (isScheduledDay && !hasDone) dueItems.push({ title: t.title, id: t.id });
          }
        }
      }
      const isToday = todayStr === dayString;

      // Build display list: union of due (not done) and done (from logs), so completed items remain visible with ✓
      const doneItemsMap = new Map<string, { id: string; title: string }>();
      for (const l of dayLogs) {
        const id = l.taskId || `title:${l.taskTitle}`;
        const title = l.taskTitle;
        if (!doneItemsMap.has(id)) doneItemsMap.set(id, { id, title });
      }
      const displayMap = new Map<string, { id: string; title: string }>();
      for (const it of dueItems) displayMap.set(it.id, { id: it.id, title: it.title });
      for (const v of doneItemsMap.values()) displayMap.set(v.id, v);
      const displayItems = Array.from(displayMap.values());

      cells.push(
        <div
          key={day.toDateString()}
          className="group relative border-t border-r border-border p-2 h-28 flex flex-col cursor-default"
          onClick={() => setLogsModalDate(dayString)}
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            setHover({ day: dayString, x, y });
          }}
        >
          <div className={`font-bold ${isToday ? 'text-brand' : ''}`}>{day.getDate()}</div>
          {/* 1) 특정 날짜에 해야하는 청소를 뱃지 형태로, 2) 여러개면 세로 정렬, 3) 길면 ... 처리 */}
          {displayItems.length > 0 && (
            <div className="flex-grow mt-1 space-y-1">
              {displayItems.slice(0, 3).map((it, idx) => {
                const key = `${dayString}:${it.id}`;
                const anyDoneToday = dayLogs.some(l => l.taskId === it.id || l.taskTitle === it.title);
                const me = currentUser?.nickname || currentUser?.name || currentUser?.email || 'unknown';
                const myLog = dayLogs.find(l => (l.taskId === it.id || l.taskTitle === it.title) && l.doneBy === me);
                const alreadyDone = completed.has(key) || anyDoneToday;
                const baseCls = 'text-[11px] rounded px-1.5 py-0.5 whitespace-nowrap overflow-hidden text-ellipsis font-medium transition cursor-pointer select-none';
                const neonCls = 'bg-elev text-ink ring-1 ring-brand/70 shadow-[0_0_8px_var(--tw-ring-color)] hover:ring-brand hover:shadow-[0_0_12px_var(--tw-ring-color)]';
                const doneCls = 'bg-green-100 text-green-900 ring-1 ring-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)]';
                const isFutureDay = startOfDay(day) > startOfDay(new Date());
                const overdueCls = 'bg-orange-400/10 text-ink ring-1 ring-orange-400/40 hover:ring-orange-500/60';
                return (
                  <div
                    key={`due-${idx}`}
                    className={`${baseCls} ${alreadyDone ? doneCls : (isFutureDay ? neonCls : overdueCls)}`}
                    onClick={async (e) => {
                      e.stopPropagation();
                      const meNow = currentUser?.nickname || currentUser?.name || currentUser?.email || 'unknown';
                      const exists = myLog; // my completion for this day
                      if (!exists) {
                        // Mark complete (optimistic)
                        const set = new Set(completed);
                        set.add(key);
                        setCompleted(set);
                        try {
                          // Record completion at the cell's date and base next schedule on that date
                          await addCleaningLogAt(it.id, it.title, meNow, dayString);
                          await updateCleaningTask(it.id, { lastDoneAt: dayString } as any);
                        } catch {
                          // ignore
                        }
                      } else {
                        // Toggle off: delete my log and recompute lastDoneAt
                        const set = new Set(completed);
                        set.delete(key);
                        setCompleted(set);
                        try {
                          await deleteCleaningLog(exists.id);
                          // Recompute latest completion for this task from logs (excluding the one we deleted)
                          const remaining = logs.filter((l) => l.taskId === it.id && l.id !== exists.id && l.at);
                          const latest = remaining.sort((a, b) => (a.at > b.at ? -1 : 1))[0];
                          await updateCleaningTask(it.id, { lastDoneAt: latest ? latest.at : null } as any);
                        } catch {
                          // ignore
                        }
                      }
                    }}
                    onMouseEnter={() => setOverBadge(true)}
                    onMouseLeave={() => setOverBadge(false)}
                    title={it.title}
                  >
                    {alreadyDone ? '✓ ' : ''}{it.title}
                  </div>
                );
              })}
              {displayItems.length > 3 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-[10px] text-muted hover:text-ink hover:bg-white/10 rounded px-1 py-0 leading-none transition"
                    onClick={(e) => { e.stopPropagation(); setDueModal({ date: dayString, items: displayItems }); }}
                    title="해야 할 청소 목록 보기"
                    aria-label={`해야 할 청소 ${displayItems.length - 3}개 더 보기`}
                  >
                    +{displayItems.length - 3}개 더
                  </button>
                </div>
              )}
            </div>
          )}
          {/* 4) 마우스 오버시 해당 날짜 안에서만 마우스를 따라다니는 오버레이 */}
          {hover && hover.day === dayString && displayItems.length > 0 && !overBadge && (
            <div
              className="absolute z-50 border border-border rounded shadow-lg text-xs bg-elev/95 text-ink backdrop-blur-sm px-2 py-1 max-w-[90%] max-h-40 overflow-auto pointer-events-none"
              style={{ left: hover.x, top: hover.y, transform: 'translate(8px, 8px)' }}
            >
              <ul className="space-y-1">
                {displayItems.map((it, i) => (
                  <li key={`overlay-${i}`} className="whitespace-nowrap overflow-hidden text-ellipsis">• {it.title}</li>
                ))}
              </ul>
            </div>
          )}
          {/* 5) 청소가 없는 날은 아무것도 표시하지 않음: dueItems.length === 0이면 위 블록이 렌더되지 않음 */}
        </div>
      );
    });

    return cells;
  }, [startingDayOfWeek, daysInMonth, logs, todayStr, completed, currentUser]);

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  return (
    <div className="card card-compact mt-4">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeMonth(-1)} className="btn-ghost">
          이전 달
        </button>
        <h2 className="text-xl font-bold">
          {year}년 {month + 1}월
        </h2>
        <button onClick={() => changeMonth(1)} className="btn-ghost">
          다음 달
        </button>
      </div>

      <div className="grid grid-cols-7 border-l border-b border-border">
        {weekdayLabels.map((day) => (
          <div
            key={day}
            className="text-center font-bold p-2 border-t border-r border-border bg-elev"
          >
            {day}
          </div>
        ))}
        {calendarDays}
      </div>
      {dueModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center" onClick={() => setDueModal(null)}>
          <div className="bg-panel rounded-lg shadow-xl w-full max-w-md p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-ink">{dueModal.date} 해야 할 청소 ({dueModal.items.length}개)</h3>
              <button className="btn-ghost btn-xs" onClick={() => setDueModal(null)}>닫기</button>
            </div>
            <ul className="max-h-72 overflow-auto divide-y divide-border">
              {dueModal.items.map((it, idx) => {
                const me = currentUser?.nickname || currentUser?.name || currentUser?.email || 'unknown';
                const my = logs.find(l => l.at?.startsWith(dueModal.date) && (l.taskId === it.id || l.taskTitle === it.title) && l.doneBy === me);
                const isDone = !!my;
                return (
                  <li key={idx} className="py-2 text-xs">
                    <button
                      type="button"
                      className={`w-full text-left flex items-center justify-between gap-2 ${isDone ? 'text-green-700' : 'text-ink'} hover:bg-white/5 rounded px-2 py-1 transition`}
                      onClick={async () => {
                        try {
                          if (!isDone) {
                            await addCleaningLogAt(it.id, it.title, me, dueModal.date);
                            await updateCleaningTask(it.id, { lastDoneAt: dueModal.date } as any);
                          } else if (my) {
                            await deleteCleaningLog(my.id);
                            const remaining = logs.filter((l) => l.taskId === it.id && l.id !== my.id && l.at);
                            const latest = remaining.sort((a, b) => (a.at > b.at ? -1 : 1))[0];
                            await updateCleaningTask(it.id, { lastDoneAt: latest ? latest.at : null } as any);
                          }
                        } catch {}
                      }}
                    >
                      <span className="truncate">{isDone ? '✓ ' : ''}{it.title}</span>
                      <span className={`text-[10px] ${isDone ? 'text-green-600' : 'text-muted'}`}>{isDone ? '완료됨' : '완료'}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
      <CleaningLogsModal isOpen={!!logsModalDate} onClose={() => setLogsModalDate(null)} dateISO={logsModalDate || undefined} />
    </div>
  );
};

export default CleaningCalendar;
