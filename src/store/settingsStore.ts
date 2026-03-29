import { create } from 'zustand';
import type { ViewMode, ColorScheme } from '../types';

const SETTINGS_KEY = 'tl_settings';

interface SettingsState {
  viewMode: ViewMode;
  currentDate: Date;
  colorScheme: ColorScheme;
  defaultNotifyBefore: number;
  showCompletedTasks: boolean;

  setViewMode: (mode: ViewMode) => void;
  setCurrentDate: (date: Date) => void;
  goToToday: () => void;
  navigateForward: () => void;
  navigateBackward: () => void;
  toggleColorScheme: () => void;
  setDefaultNotifyBefore: (m: number) => void;
  toggleShowCompleted: () => void;
}

function loadSaved() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function persist(partial: any) {
  try {
    const existing = loadSaved() || {};
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...existing, ...partial }));
  } catch {}
}

const saved = loadSaved();

export const useSettingsStore = create<SettingsState>((set, get) => ({
  viewMode: 'week',
  currentDate: new Date(),
  colorScheme: saved?.colorScheme || 'dark',
  defaultNotifyBefore: saved?.defaultNotifyBefore ?? 15,
  showCompletedTasks: saved?.showCompletedTasks ?? true,

  setViewMode: (mode) => set({ viewMode: mode }),
  setCurrentDate: (date) => set({ currentDate: date }),
  goToToday: () => set({ currentDate: new Date() }),

  navigateForward: () => {
    const { viewMode, currentDate: d } = get();
    const next = new Date(d);
    if (viewMode === 'day') next.setDate(next.getDate() + 1);
    else if (viewMode === 'week') next.setDate(next.getDate() + 7);
    else if (viewMode === 'month') next.setMonth(next.getMonth() + 1);
    else next.setFullYear(next.getFullYear() + 1);
    set({ currentDate: next });
  },

  navigateBackward: () => {
    const { viewMode, currentDate: d } = get();
    const prev = new Date(d);
    if (viewMode === 'day') prev.setDate(prev.getDate() - 1);
    else if (viewMode === 'week') prev.setDate(prev.getDate() - 7);
    else if (viewMode === 'month') prev.setMonth(prev.getMonth() - 1);
    else prev.setFullYear(prev.getFullYear() - 1);
    set({ currentDate: prev });
  },

  toggleColorScheme: () => {
    const next = get().colorScheme === 'dark' ? 'light' : 'dark';
    set({ colorScheme: next });
    persist({ colorScheme: next });
  },

  setDefaultNotifyBefore: (m) => {
    set({ defaultNotifyBefore: m });
    persist({ defaultNotifyBefore: m });
  },

  toggleShowCompleted: () => {
    const next = !get().showCompletedTasks;
    set({ showCompletedTasks: next });
    persist({ showCompletedTasks: next });
  },
}));
