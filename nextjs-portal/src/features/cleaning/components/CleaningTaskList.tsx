import React, { useEffect, useMemo, useState } from 'react';
import type { CleaningTask } from '../types';
import CleaningTaskItem from './CleaningTaskItem';
import { subscribeCleaningTasks } from '../services/cleaningRepo';
import { ChevronDown, ChevronRight } from 'lucide-react';
import CleaningLogsModal from './CleaningLogsModal';

interface CleaningTaskListProps {
  onEdit: (task: CleaningTask) => void;
  initialTasks?: CleaningTask[];
  live?: boolean; // subscribe to Firestore
  readOnly?: boolean; // hide admin actions
}

/**
 * CleaningTaskList - Displays a list of cleaning tasks grouped by category
 */
const CleaningTaskList: React.FC<CleaningTaskListProps> = ({ onEdit, initialTasks, live = true, readOnly = false }) => {
  const [tasks, setTasks] = useState<CleaningTask[]>(initialTasks || []);
  useEffect(() => {
    if (!live) {
      setTasks(initialTasks || []);
      return;
    }
    const unsub = subscribeCleaningTasks(setTasks);
    return () => unsub();
  }, [live, initialTasks]);
  const tasksToDisplay = tasks;

  // Group by category (stable across renders unless input changes)
  const groupedTasks = useMemo(() => {
    const groups: Record<string, CleaningTask[]> = {};
    for (const task of tasksToDisplay) {
      (groups[task.category] ||= []).push(task);
    }
    return groups;
  }, [tasksToDisplay]);

  // Collapsible state per category
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  // Initialize/refresh open set when categories change (default open)
  useEffect(() => {
    const newKeys = new Set(Object.keys(groupedTasks));
    setOpenCategories((prev) => {
      // If same set of categories, keep previous (avoids unnecessary rerenders)
      if (prev.size === newKeys.size && [...prev].every((k) => newKeys.has(k))) {
        return prev;
      }
      return newKeys; // open all newly computed categories
    });
  }, [groupedTasks]);

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const categoryKeys = useMemo(
    () => Object.keys(groupedTasks).sort((a, b) => a.localeCompare(b)),
    [groupedTasks]
  );

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTask, setHistoryTask] = useState<CleaningTask | null>(null);

  const onHistory = (task: CleaningTask) => {
    setHistoryTask(task);
    setHistoryOpen(true);
  };

  return (
    <div className="card card-compact">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">청소 목록</h2>
      </div>

      <div className="overflow-x-auto">
        {categoryKeys.length === 0 ? (
          <p className="text-muted text-sm">표시할 청소 업무가 없습니다.</p>
        ) : (
          <>
            {/* Global header for columns */}
            <div className="grid grid-cols-[1fr_80px_160px] gap-2 p-2 bg-white/5 text-xs font-medium text-muted border-b border-border rounded-t-md whitespace-nowrap">
              <div>청소명</div>
              <div>주기</div>
              <div>예정일</div>
            </div>

            {categoryKeys.map((category) => (
              <section key={category} className="mb-4 last:mb-0">
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  aria-expanded={openCategories.has(category)}
                  className="w-full flex items-center justify-between p-2 bg-white/3 hover:bg-white/7 rounded-md text-left font-medium text-ink transition-colors text-sm"
                >
                  <span className="inline-flex items-center gap-2">
                    {openCategories.has(category) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    {category}
                  </span>
                  <span className="ml-2 text-muted text-xs">
                    {groupedTasks[category].length}개
                  </span>
                </button>

                {openCategories.has(category) && (
                  <div className="mt-1 border border-border rounded-md overflow-hidden">
                    {groupedTasks[category].map((task) => (
                      <CleaningTaskItem key={task.id} task={task} onEdit={onEdit} readOnly={readOnly} onHistory={onHistory} />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </>
        )}
      </div>
      <CleaningLogsModal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} task={historyTask || undefined} />
    </div>
  );
};

export default CleaningTaskList; // 기본 default export
export { CleaningTaskList }; // 및 named export도 함께 노출
