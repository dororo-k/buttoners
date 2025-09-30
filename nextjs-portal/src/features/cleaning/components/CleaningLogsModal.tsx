"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { subscribeCleaningLogs, type CleaningLogDoc } from '../services/cleaningLogsRepo';
import type { CleaningTask } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  dateISO?: string; // filter by date (YYYY-MM-DD)
  task?: CleaningTask; // filter by task
}

export default function CleaningLogsModal({ isOpen, onClose, dateISO, task }: Props) {
  const [logs, setLogs] = useState<CleaningLogDoc[]>([]);

  useEffect(() => {
    if (!isOpen) return; // subscribe only when visible to reduce work
    const unsub = subscribeCleaningLogs(setLogs);
    return () => { try { unsub && unsub(); } catch {} };
  }, [isOpen]);

  const filtered = useMemo(() => {
    let list = logs;
    if (dateISO) {
      list = list.filter((l) => l.at && l.at.startsWith(dateISO));
    }
    if (task) {
      list = list.filter((l) => l.taskId === task.id || l.taskTitle === task.title);
    }
    return list.sort((a, b) => (a.at > b.at ? -1 : 1));
  }, [logs, dateISO, task]);

  if (!isOpen) return null;

  const title = task
    ? `작업 이력 - ${task.title}`
    : dateISO
    ? `${dateISO} 완료자`
    : '청소 이력';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-panel rounded-lg shadow-xl w-full max-w-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-ink">{title}</h3>
          <button className="btn-ghost text-sm" onClick={onClose}>닫기</button>
        </div>

        {filtered.length === 0 ? (
          <div className="text-sm text-muted">표시할 이력이 없습니다.</div>
        ) : (
          <ul className="divide-y divide-border max-h-80 overflow-auto">
            {filtered.map((l) => (
              <li key={l.id} className="py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink truncate">{l.taskTitle}</div>
                  <div className="text-xs text-muted truncate">{new Date(l.at).toLocaleString()}</div>
                </div>
                <div className="text-sm font-semibold text-ink shrink-0">{l.doneBy || 'unknown'}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

