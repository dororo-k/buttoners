import React from 'react';
import type { CleaningTask } from '../types';
import { useAppStore } from '@/components/providers/StoreProvider';
import { deleteCleaningTask } from '../services/cleaningRepo';
import { History, Pencil, Trash2 } from 'lucide-react';

interface CleaningTaskItemProps {
  task: CleaningTask;
  onEdit: (task: CleaningTask) => void;
  readOnly?: boolean;
  onHistory?: (task: CleaningTask) => void;
}

const CleaningTaskItem: React.FC<CleaningTaskItemProps> = ({ task, onEdit, readOnly, onHistory }) => {
  const isAdmin = useAppStore('adminSession', (state) => state.isAdmin);

  const getIntervalText = (task: CleaningTask) => {
    switch (task.interval.type) {
      case 'daily':
        return '매일';
      case 'weekly':
        const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
        return `매주 ${weekdays[task.interval.weekday || 0]}요일`;
      case 'everyN':
        return `${task.interval.n}일`;
      default:
        return '';
    }
  };

  // Compute due date from lastDoneAt + interval
  const formatYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const toDate = (v: number | string | null | undefined): Date | null => {
    if (!v && v !== 0) return null;
    try {
      if (typeof v === 'number') return new Date(v);
      if (typeof v === 'string') return new Date(v);
    } catch {}
    return null;
  };
  const nextWeekdayAfter = (from: Date, weekday: number): Date => {
    const d = new Date(from);
    d.setDate(d.getDate() + 1);
    while (d.getDay() !== weekday) d.setDate(d.getDate() + 1);
    return d;
  };
  const nextWeekdayFromToday = (weekday: number): Date => {
    const today = new Date();
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    while (d.getDay() !== weekday) d.setDate(d.getDate() + 1);
    return d;
  };
  const addDays = (d: Date, n: number) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const last = toDate(task.lastDoneAt);
  let dueDate: Date | null = null;
  if (task.interval.type === 'daily') {
    dueDate = last ? addDays(last, 1) : new Date();
  } else if (task.interval.type === 'weekly') {
    const w = task.interval.weekday ?? 0;
    dueDate = last ? nextWeekdayAfter(last, w) : nextWeekdayFromToday(w);
  } else if (task.interval.type === 'everyN') {
    const n = task.interval.n || 0;
    dueDate = last && n > 0 ? addDays(last, n) : new Date();
  }
  const dueText = dueDate ? formatYMD(dueDate) : '-';
  const overdue = dueDate ? startOfDay(dueDate) < startOfDay(new Date()) : false;

  return (
    <div className="grid grid-cols-[1fr_80px_160px] gap-2 p-2 border-b border-gray-200 last:border-b-0 items-center hover:bg-white/5 transition-colors">
      {/* 청소명 + (좌측 아이콘 액션) */}
      <div className="min-w-0 flex items-center gap-1.5">
        <div className="truncate text-xs font-medium text-ink flex-1" title={task.title}>{task.title}</div>
        <div className="flex items-center gap-1.5 shrink-0">
          {onHistory && (
            <button
              type="button"
              onClick={() => onHistory(task)}
              className="text-muted hover:text-ink"
              title="히스토리"
              aria-label="히스토리"
            >
              <History className="w-3.5 h-3.5" />
            </button>
          )}
          {isAdmin && !readOnly && (
            <>
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="text-muted hover:text-ink"
                title="수정"
                aria-label="수정"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => deleteCleaningTask(task.id)}
                className="text-muted hover:text-red-600"
                title="삭제"
                aria-label="삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
      {/* 주기 */}
      <div className="truncate text-[11px] text-muted" title={getIntervalText(task)}>
        {getIntervalText(task)}
      </div>
      {/* 예정일 */}
      <div className={`truncate text-xs ${overdue ? 'text-orange-600' : 'text-muted'}`} title={dueText}>{dueText}</div>
    </div>
  );
};

export default CleaningTaskItem;
