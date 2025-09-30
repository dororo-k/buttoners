import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { subscribeCleaningLogs, aggregateLeaderboard, type CleaningLogDoc } from '../services/cleaningLogsRepo';

const CleaningLeaderboard: React.FC = () => {
  const [logs, setLogs] = useState<CleaningLogDoc[]>([]);
  const [leaderboard, setLeaderboard] = useState<{ doneBy: string; count: number }[]>([]);
  const [current, setCurrent] = useState(new Date());

  useEffect(() => {
    const unsub = subscribeCleaningLogs(setLogs);
    return () => {
      try { unsub && unsub(); } catch {}
    };
  }, []);

  const monthFiltered = useMemo(() => {
    const y = current.getFullYear();
    const m = current.getMonth();
    return logs.filter((l) => {
      if (!l.at) return false;
      const d = new Date(l.at);
      return d.getFullYear() === y && d.getMonth() === m;
    });
  }, [logs, current]);

  useEffect(() => {
    setLeaderboard(aggregateLeaderboard(monthFiltered));
  }, [monthFiltered]);

  const title = useMemo(() => `${current.getFullYear()}년 ${current.getMonth() + 1}월 리더보드`, [current]);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-ink">{title}</div>
        <div className="space-x-0.5">
          <button
            className="btn-ghost btn-xs p-1"
            onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))}
            aria-label="이전 달"
            title="이전 달"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button
            className="btn-ghost btn-xs p-1"
            onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))}
            aria-label="다음 달"
            title="다음 달"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
      {leaderboard.length === 0 ? (
        <p className="text-muted">아직 완료된 청소 업무가 없습니다.</p>
      ) : (
        <ol className="list-decimal list-inside">
          {leaderboard.map((entry, index) => (
            <li key={index} className="text-lg mb-2">
              <span className="font-semibold">{entry.doneBy}</span>: {entry.count}건 완료
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

export default CleaningLeaderboard;
