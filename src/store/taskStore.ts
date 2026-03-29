import { create } from 'zustand';
import type { Task } from '../types';
import {
  db,
  tasksCollection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from '../lib/firebase';
import { startOfDay, endOfDay } from 'date-fns';

function generateId(): string {
  return crypto.randomUUID();
}

// LocalStorage fallback (Firebase config yoksa)
function getLocalTasks(): Task[] {
  try {
    return JSON.parse(localStorage.getItem('tl_tasks') || '[]');
  } catch { return []; }
}
function setLocalTasks(tasks: Task[]) {
  localStorage.setItem('tl_tasks', JSON.stringify(tasks));
}

const useFirebase = () => true;

interface TaskState {
  tasks: Task[];
  selectedTask: Task | null;
  isLoading: boolean;

  loadTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  selectTask: (task: Task | null) => void;
  getTasksForDate: (date: Date) => Task[];
  getTasksForRange: (start: Date, end: Date) => Task[];
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  selectedTask: null,
  isLoading: false,

  loadTasks: async () => {
    set({ isLoading: true });
    try {
      if (useFirebase()) {
        const q = query(tasksCollection, orderBy('startTime', 'asc'));
        const snapshot = await getDocs(q);
        const tasks = snapshot.docs.map(d => d.data() as Task);
        set({ tasks, isLoading: false });
      } else {
        set({ tasks: getLocalTasks(), isLoading: false });
      }
    } catch (err) {
      console.warn('[Tasks] Load error:', err);
      set({ tasks: getLocalTasks(), isLoading: false });
    }
  },

  addTask: async (taskData) => {
    const now = Date.now();
    const newTask: Task = { ...taskData, id: generateId(), createdAt: now, updatedAt: now };

    set(s => ({ tasks: [...s.tasks, newTask] }));

    try {
      if (useFirebase()) {
        await setDoc(doc(db, 'tasks', newTask.id), newTask);
      }
    } catch (err) { console.warn('[Tasks] Add error:', err); }

    setLocalTasks(get().tasks);
    return newTask;
  },

  updateTask: async (id, updates) => {
    const updatedAt = Date.now();
    set(s => ({
      tasks: s.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt } : t),
    }));

    try {
      if (useFirebase()) {
        await updateDoc(doc(db, 'tasks', id), { ...updates, updatedAt });
      }
    } catch (err) { console.warn('[Tasks] Update error:', err); }

    setLocalTasks(get().tasks);
  },

  deleteTask: async (id) => {
    set(s => ({
      tasks: s.tasks.filter(t => t.id !== id),
      selectedTask: s.selectedTask?.id === id ? null : s.selectedTask,
    }));

    try {
      if (useFirebase()) {
        await deleteDoc(doc(db, 'tasks', id));
      }
    } catch (err) { console.warn('[Tasks] Delete error:', err); }

    setLocalTasks(get().tasks);
  },

  toggleComplete: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;
    await get().updateTask(id, { isCompleted: !task.isCompleted });
  },

  selectTask: (task) => set({ selectedTask: task }),

  getTasksForDate: (date) => {
    const dayStart = startOfDay(date).getTime();
    const dayEnd = endOfDay(date).getTime();
    return get().tasks.filter(t => {
      if (t.startTime < dayEnd && t.endTime > dayStart) return true;
      if (t.isRecurring && t.recurrenceRule) return isRecurringOnDate(t, date);
      return false;
    });
  },

  getTasksForRange: (start, end) => {
    const s = start.getTime(), e = end.getTime();
    return get().tasks.filter(t => t.startTime < e && t.endTime > s);
  },
}));

function isRecurringOnDate(task: Task, date: Date): boolean {
  if (!task.recurrenceRule) return false;
  const rule = task.recurrenceRule;
  const taskDate = new Date(task.startTime);
  const checkDate = startOfDay(date);
  const taskStartDay = startOfDay(taskDate);
  if (checkDate < taskStartDay) return false;
  if (rule.endDate && checkDate.getTime() > rule.endDate) return false;

  const diffMs = checkDate.getTime() - taskStartDay.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  switch (rule.type) {
    case 'daily': return diffDays % (rule.interval || 1) === 0;
    case 'weekly': {
      if (rule.daysOfWeek?.length) return rule.daysOfWeek.includes(date.getDay());
      return Math.floor(diffDays / 7) % (rule.interval || 1) === 0 && date.getDay() === taskDate.getDay();
    }
    case 'monthly': {
      const diffMonths = (date.getFullYear() - taskDate.getFullYear()) * 12 + date.getMonth() - taskDate.getMonth();
      return diffMonths % (rule.interval || 1) === 0 && date.getDate() === taskDate.getDate();
    }
    default: return false;
  }
}
