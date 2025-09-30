import React, { useEffect, useState } from 'react';

import type { CleaningTask, Interval } from '../types';

import { addCleaningTask, updateCleaningTask } from '../services/cleaningRepo';

interface CleaningTaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: CleaningTask | null;
}

const CleaningTaskForm: React.FC<CleaningTaskFormProps> = ({ isOpen, onClose, taskToEdit }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(''); // New state for category
  const [intervalType, setIntervalType] = useState<'daily' | 'weekly' | 'everyN'>('daily');
  const [intervalN, setIntervalN] = useState<number | undefined>(undefined);
  const [intervalWeekday, setIntervalWeekday] = useState<number | undefined>(undefined);
  const [checklist, setChecklist] = useState<string>('');
  const [active, setActive] = useState(true);

  // Firestore 연동: addCleaningTask / updateCleaningTask 사용

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setCategory(taskToEdit.category || ''); // Initialize category
      const { interval } = taskToEdit;
      setIntervalType(interval.type);
      if (interval.type === 'everyN') {
        setIntervalN(interval.n);
        setIntervalWeekday(undefined);
      } else if (interval.type === 'weekly') {
        setIntervalWeekday(interval.weekday);
        setIntervalN(undefined);
      } else {
        setIntervalN(undefined);
        setIntervalWeekday(undefined);
      }
      setChecklist(taskToEdit.checklist ? taskToEdit.checklist.join('\n') : '');
      setActive(taskToEdit.active);
    } else {
      // Reset form for new task
      setTitle('');
      setCategory(''); // Reset category
      setIntervalType('daily');
      setIntervalN(undefined);
      setIntervalWeekday(undefined);
      setChecklist('');
      setActive(true);
    }
  }, [taskToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newInterval: Interval = (() => {
      switch (intervalType) {
        case 'everyN':
          return { type: 'everyN', n: intervalN! };
        case 'weekly':
          return { type: 'weekly', weekday: intervalWeekday! };
        default:
          return { type: 'daily' };
      }
    })();

    const taskData: Omit<CleaningTask, 'id' | 'lastDoneAt'> = {
      title,
      category, // Include category in taskData
      interval: newInterval,
      checklist: checklist.split('\n').filter((item) => item.trim() !== ''),
      active,
    };

    if (taskToEdit) {
      await updateCleaningTask(taskToEdit.id, taskData);
    } else {
      await addCleaningTask(taskData);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-panel p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">{taskToEdit ? '업무 수정' : '새 업무 추가'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="meta">제목</label>
            <input
              type="text"
              id="title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* New category input field */}
          <div className="mb-4">
            <label htmlFor="category" className="meta">카테고리</label>
            <input
              type="text"
              id="category"
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="intervalType" className="meta">주기</label>
            <select
              id="intervalType"
              className="input"
              value={intervalType}
              onChange={(e) => setIntervalType(e.target.value as 'daily' | 'weekly' | 'everyN')}
            >
              <option value="daily">매일</option>
              <option value="weekly">매주</option>
              <option value="everyN">N일마다</option>
            </select>
          </div>

          {intervalType === 'everyN' && (
            <div className="mb-4">
              <label htmlFor="intervalN" className="meta">N일</label>
              <input
                type="number"
                id="intervalN"
                className="input"
                value={intervalN || ''}
                onChange={(e) => setIntervalN(parseInt(e.target.value) || undefined)}
                min="1"
                required
              />
            </div>
          )}

          {intervalType === 'weekly' && (
            <div className="mb-4">
              <label htmlFor="intervalWeekday" className="meta">요일</label>
              <select
                id="intervalWeekday"
                className="input"
                value={intervalWeekday || ''}
                onChange={(e) => setIntervalWeekday(parseInt(e.target.value) || undefined)}
                required
              >
                <option value="">선택</option>
                <option value="0">일요일</option>
                <option value="1">월요일</option>
                <option value="2">화요일</option>
                <option value="3">수요일</option>
                <option value="4">목요일</option>
                <option value="5">금요일</option>
                <option value="6">토요일</option>
              </select>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="checklist" className="meta">체크리스트 (줄바꿈으로 구분)</label>
            <textarea
              id="checklist"
              className="input h-24"
              value={checklist}
              onChange={(e) => setChecklist(e.target.value)}
            ></textarea>
          </div>

          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="active"
              className="mr-2 leading-tight"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <label htmlFor="active" className="meta">활성화</label>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="btn-primary"
            >
              {taskToEdit ? '수정' : '추가'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost text-muted hover:text-ink"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CleaningTaskForm;