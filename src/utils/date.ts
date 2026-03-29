import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addHours,
  isSameDay,
  isToday,
} from 'date-fns';
import { tr } from 'date-fns/locale';

export const HOURS = Array.from({ length: 24 }, (_, i) => i);
export const HOUR_HEIGHT = 60;

export function formatHour(h: number) {
  return `${h.toString().padStart(2, '0')}:00`;
}

export function formatDate(d: Date) {
  return format(d, 'd MMM yyyy', { locale: tr });
}

export function formatDateTime(d: Date) {
  return format(d, 'd MMM HH:mm', { locale: tr });
}

export function formatTime(d: Date) {
  return format(d, 'HH:mm');
}

export function formatMonthYear(d: Date) {
  return format(d, 'MMMM yyyy', { locale: tr });
}

export function formatDayName(d: Date) {
  return format(d, 'EEE', { locale: tr }).toUpperCase();
}

export function getDaysOfWeek(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function getDaysOfMonth(date: Date): Date[] {
  return eachDayOfInterval({ start: startOfMonth(date), end: endOfMonth(date) });
}

export { isSameDay, isToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addHours };
