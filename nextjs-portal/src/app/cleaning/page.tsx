'use client';

import PageLayout from '@/components/PageLayout';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import CleaningLeaderboard from '@/features/cleaning/components/CleaningLeaderboard';
import CleaningTaskList from '@/features/cleaning/components/CleaningTaskList';
import CleaningTaskForm from '@/features/cleaning/components/CleaningTaskForm';
import CleaningCalendar from '@/features/cleaning/components/CleaningCalendar';
import { useAppStore } from '@/components/providers/StoreProvider';
import type { CleaningTask } from '@/types/cleaning';
import { subscribeCleaningTasks } from '@/features/cleaning/services/cleaningRepo';

export default function CleaningPage() {
  const isAdmin = useAppStore('adminSession', (state) => state.isAdmin);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CleaningTask | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'calendar' | 'stats'>('list');

  const handleEdit = (task: CleaningTask) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleAddClick = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTask(null);
  };

  // Admin helper: if no tasks exist, show a seed/import button
  const [taskCount, setTaskCount] = useState<number>(0);
  useEffect(() => {
    const unsub = subscribeCleaningTasks((items) => setTaskCount(items.length));
    return () => { try { unsub && unsub(); } catch {} };
  }, []);

  const importFromDummy = async () => {
    try {
      const res = await fetch('/api/cleaning/import-from-dummy', { method: 'POST' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        try { notifications.show({ color: 'red', message: '가져오기 실패: ' + (j?.error || res.statusText) }); } catch {}
      } else {
        const j = await res.json();
        try { notifications.show({ color: 'green', message: `가져오기 완료: ${j.imported}건` }); } catch {}
      }
    } catch (e: any) {
      try { notifications.show({ color: 'red', message: '가져오기 오류: ' + (e?.message || 'unknown') }); } catch {}
    }
  };

  return (
    <PageLayout
      title="청소 관리"
      description="주기적인 청소 업무를 확인하고 완료 상태를 관리합니다."
    >
      <div className="flex items-center justify-between mt-6">
        <div className="flex border-b border-gray-200">
          <button className={`py-2 px-4 text-sm font-medium ${activeTab === 'list' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('list')}>청소 목록</button>
          <button className={`py-2 px-4 text-sm font-medium ${activeTab === 'calendar' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('calendar')}>청소 캘린더</button>
          <button className={`py-2 px-4 text-sm font-medium ${activeTab === 'stats' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('stats')}>청소 현황</button>
        </div>
        {isAdmin && activeTab === 'list' && (
          <button type="button" onClick={handleAddClick} className="btn-primary">새 업무 추가</button>
        )}
      </div>
      {isAdmin && taskCount === 0 && (
        <div className="mt-3 text-xs text-muted flex items-center gap-2">
          청소 목록이 비어 있습니다.
          <button type="button" className="btn-ghost btn-xs" onClick={importFromDummy}>샘플 목록 가져오기</button>
        </div>
      )}

      {activeTab === 'list' && (
        <div className="grid grid-cols-1 gap-4">
          <CleaningTaskList onEdit={handleEdit} live={true} />
        </div>
      )}

      {activeTab === 'calendar' && (
        <div><CleaningCalendar /></div>
      )}

      {activeTab === 'stats' && (
        <div className="mt-4">
          <h2 className="text-2xl font-bold mb-4">청소 현황</h2>
          <CleaningLeaderboard />
        </div>
      )}

      <CleaningTaskForm isOpen={isFormOpen} onClose={handleFormClose} taskToEdit={editingTask} />
    </PageLayout>
  );
}
