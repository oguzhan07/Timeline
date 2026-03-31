import { useMemo, useState, useCallback, useRef } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useTaskStore } from '../store/taskStore';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  format,
} from 'date-fns';
import { tr } from 'date-fns/locale';

interface Props {
  onMonthClick: (month: number) => void;
  onRangeSelect: (startDate: Date, endDate: Date) => void;
}

export default function YearView({ onMonthClick, onRangeSelect }: Props) {
  const currentDate = useSettingsStore(s => s.currentDate);
  const tasks = useTaskStore(s => s.tasks);
  const year = currentDate.getFullYear();

  // Drag state: track actual dates for cross-month selection
  const [selection, setSelection] = useState<{ startDate: Date; endDate: Date } | null>(null);
  const isDragging = useRef(false);
  const didDrag = useRef(false);

  const selRange = useMemo(() => {
    if (!selection) return null;
    const s = selection.startDate.getTime();
    const e = selection.endDate.getTime();
    return { min: Math.min(s, e), max: Math.max(s, e) };
  }, [selection]);

  const handleDayMouseDown = useCallback((day: Date, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    didDrag.current = false;
    setSelection({ startDate: day, endDate: day });
  }, []);

  const handleDayMouseEnter = useCallback((day: Date) => {
    if (!isDragging.current) return;
    didDrag.current = true;
    setSelection(prev => prev ? { ...prev, endDate: day } : prev);
  }, []);

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, m) => {
      const monthDate = new Date(year, m, 1);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start: calStart, end: calEnd });

      const taskDays = new Set<string>();
      const ms = monthStart.getTime();
      const me = monthEnd.getTime() + 86400000;
      tasks.filter(t => t.startTime < me && t.endTime > ms).forEach(t => {
        // Mark every day the task spans, not just the start day
        const tStart = Math.max(t.startTime, ms);
        const tEnd = Math.min(t.endTime, me);
        let cur = new Date(tStart);
        cur.setHours(0, 0, 0, 0);
        while (cur.getTime() < tEnd) {
          taskDays.add(`${cur.getFullYear()}-${cur.getMonth()}-${cur.getDate()}`);
          cur = new Date(cur.getTime() + 86400000);
        }
      });

      return { month: m, name: format(monthDate, 'MMMM', { locale: tr }), days, taskDays };
    });
  }, [year, tasks]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current || !selection) {
      isDragging.current = false;
      setSelection(null);
      return;
    }
    isDragging.current = false;

    const s = selection.startDate.getTime();
    const e = selection.endDate.getTime();
    const startDate = s <= e ? selection.startDate : selection.endDate;
    const endDate = s <= e ? selection.endDate : selection.startDate;

    onRangeSelect(startDate, endDate);
    setSelection(null);
  }, [selection, onRangeSelect]);

  const handleCardClick = useCallback((month: number) => {
    if (!didDrag.current) {
      onMonthClick(month);
    }
  }, [onMonthClick]);

  const isDaySelected = (day: Date) => {
    if (!selRange) return false;
    const t = day.getTime();
    return t >= selRange.min && t <= selRange.max;
  };

  return (
    <div
      className="year-view"
      onMouseUp={handleMouseUp}
      onMouseLeave={() => { if (isDragging.current) { isDragging.current = false; setSelection(null); } }}
    >
      <div className="year-grid">
        {months.map(({ month, name, days, taskDays }) => (
          <div
            key={month}
            className="year-month-card"
            onClick={() => handleCardClick(month)}
          >
            <div className="year-month-title">{name}</div>
            <div className="year-mini-grid">
              {['P', 'S', 'Ç', 'P', 'C', 'C', 'P'].map((d, i) => (
                <div key={i} style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '9px' }}>{d}</div>
              ))}
              {days.map((day, i) => {
                const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
                const hasTasks = taskDays.has(key);
                const inMonth = day.getMonth() === month;
                const selected = inMonth && isDaySelected(day);
                return (
                  <div
                    key={i}
                    className={`year-mini-day ${hasTasks ? 'has-tasks' : ''} ${isToday(day) ? 'today' : ''} ${selected ? 'selected' : ''}`}
                    style={{ opacity: inMonth ? 1 : 0.2, cursor: inMonth ? 'pointer' : 'default' }}
                    onMouseDown={(e) => inMonth && handleDayMouseDown(day, e)}
                    onMouseEnter={() => inMonth && handleDayMouseEnter(day)}
                  >
                    {format(day, 'd')}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
