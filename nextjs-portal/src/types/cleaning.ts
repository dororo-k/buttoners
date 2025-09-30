export type Interval = 
  | { type: 'daily' }
  | { type: 'weekly', weekday: number }
  | { type: 'everyN', n: number };

export interface CleaningTask {
  id: string;
  title: string;
  category: string;
  interval: Interval;
  checklist?: string[];
  active: boolean;
  lastDoneAt?: number | string | null; // ISO string
}

export interface CleaningLog {
  id: string;
  taskId: string;
  taskTitle: string;
  doneBy: string;
  at: string; // ISO string
}

