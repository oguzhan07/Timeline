export type ViewMode = 'day' | 'week' | 'month' | 'year';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
export type ColorScheme = 'light' | 'dark';
export type EntryType = 'task' | 'note';

export interface RecurrenceRule {
  type: RecurrenceType;
  interval?: number;
  endDate?: number;
  daysOfWeek?: number[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  color: string;
  priority: 1 | 2 | 3 | 4 | 5;
  isRecurring: boolean;
  recurrenceRule: RecurrenceRule | null;
  notifyBefore: number;
  isCompleted: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Note {
  id: string;
  taskId: string | null;
  content: string;
  timeStart: number | null;
  timeEnd: number | null;
  color: string;
  createdAt: number;
  updatedAt: number;
}

export interface GridSelection {
  startDate: Date;
  endDate: Date;
  startHour: number;
  endHour: number;
}
