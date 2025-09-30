import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CleaningLog, CleaningTask } from '@/types/cleaning';

export interface CleaningState {
  tasks: CleaningTask[];
  logs: CleaningLog[];
  addTask: (task: Omit<CleaningTask, 'id' | 'lastDoneAt'>) => void;
  updateTask: (id: string, updatedTask: Partial<CleaningTask>) => void;
  deleteTask: (id: string) => void;
  markTaskComplete: (taskId: string, taskTitle: string, doneBy: string) => void;
  getTasksForToday: () => CleaningTask[];
  getLeaderboard: () => { doneBy: string; count: number }[];
}

export const createCleaningStore = (initialState: Partial<CleaningState> = {}) =>
  create<CleaningState>()(
    persist(
      (set, get) => ({
        tasks: [],
        logs: [],
        addTask: (task) => {
          set((state) => ({ tasks: [...state.tasks, { ...task, id: uuidv4(), lastDoneAt: undefined }] }));
        },
        updateTask: (id, updatedTask) => {
          set((state) => ({ tasks: state.tasks.map((task) => (task.id === id ? { ...task, ...updatedTask } : task)) }));
        },
        deleteTask: (id) => {
          set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) }));
        },
        markTaskComplete: (taskId, taskTitle, doneBy) => {
          const now = new Date().toISOString();
          const newLog: CleaningLog = { id: uuidv4(), taskId, taskTitle, doneBy, at: now };
          set((state) => ({
            logs: [...state.logs, newLog],
            tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, lastDoneAt: now } : task)),
          }));
        },
        getTasksForToday: () => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return get().tasks.filter((task) => {
            if (!task.active) return false;
            const lastDoneDate = task.lastDoneAt ? new Date(task.lastDoneAt) : null;
            if (lastDoneDate) lastDoneDate.setHours(0, 0, 0, 0);
            switch (task.interval.type) {
              case 'daily':
                return !lastDoneDate || lastDoneDate.getTime() < today.getTime();
              case 'weekly':
                if (task.interval.weekday !== undefined) {
                  const currentDay = today.getDay();
                  const targetDay = task.interval.weekday;
                  if (currentDay === targetDay) {
                    if (!lastDoneDate) return true;
                    const startOfWeek = new Date(today);
                    startOfWeek.setDate(today.getDate() - currentDay);
                    startOfWeek.setHours(0, 0, 0, 0);
                    return lastDoneDate.getTime() < startOfWeek.getTime();
                  }
                }
                return false;
              case 'everyN':
                if (task.interval.n) {
                  if (!lastDoneDate) return true;
                  const nextDueDate = new Date(lastDoneDate);
                  nextDueDate.setDate(lastDoneDate.getDate() + task.interval.n);
                  nextDueDate.setHours(0, 0, 0, 0);
                  return nextDueDate.getTime() <= today.getTime();
                }
                return false;
              default: return false;
            }
          });
        },
        getLeaderboard: () => {
          const leaderboardMap = new Map<string, number>();
          get().logs.forEach((log) => {
            leaderboardMap.set(log.doneBy, (leaderboardMap.get(log.doneBy) || 0) + 1);
          });
          return Array.from(leaderboardMap.entries())
            .map(([doneBy, count]) => ({ doneBy, count }))
            .sort((a, b) => b.count - a.count);
        },
        ...initialState,
      }),
      { name: 'cleaning-storage', storage: createJSONStorage(() => localStorage) }
    )
  );

