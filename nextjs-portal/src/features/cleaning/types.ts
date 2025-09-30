export type Interval =
  | { type: 'daily' }
  | { type: 'weekly'; weekday: number }
  | { type: 'everyN'; n: number };

export interface CleaningTask {
  id: string;
  title: string;
  category: string; // Added category field
  interval: Interval;
  lastDoneAt?: number | string | null;
  checklist?: string[]; // NOTE: CleaningTaskForm에서 사용되어 추가했습니다.
  active: boolean; // NOTE: CleaningTaskForm에서 사용되어 추가했습니다.
}

export interface CleaningLog {
  id: string;
  taskId: string;
  title: string;
  doneBy: string;
  doneAt: number;
}