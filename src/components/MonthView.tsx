import { useMemo, useState, useCallback, useRef } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useTaskStore } from '../store/taskStore';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  startOfDay,
  format,
} from 'date-fns';

const WEEK_DAYS = ['Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt', 'Paz'];

interface Props {
  onDayClick: (date: Date) => void;
  onRangeSelect: (startDate: Date, endDate: Date) => void;
}

export default function MonthView({ onDayClick, onRangeSelect }: Props) {
  const currentDate = useSettingsStore(s => s.currentDate);
  const showCompleted = useSettingsStore(s => s.showCompletedTasks);
  const allTasks = useTaskStore(s => s.tasks);
  const tasks = showCompleted ? allTasks : allTasks.filter(t => !t.isCompleted);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  // Drag selection state
  const [selection, setSelection] = useState<{ startIdx: number; endIdx: number } | null>(null);
  const isDragging = useRef(false);

  const selBounds = useMemo(() => {
    if (!selection) return null;
    return {
      min: Math.min(selection.startIdx, selection.endIdx),
      max: Math.max(selection.startIdx, selection.endIdx),
    };
  }, [selection]);

  const handleMouseDown = useCallback((idx: number) => {
    isDragging.current = true;
    setSelection({ startIdx: idx, endIdx: idx });
  }, []);

  const handleMouseEnter = useCallback((idx: number) => {
    if (!isDragging.current) return;
    setSelection(prev => prev ? { ...prev, endIdx: idx } : prev);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current || !selection) {
      isDragging.current = false;
      setSelection(null);
      return;
    }
    isDragging.current = false;

    const minIdx = Math.min(selection.startIdx, selection.endIdx);
    const maxIdx = Math.max(selection.startIdx, selection.endIdx);

    if (minIdx === maxIdx) {
      // Tek gün tıklaması — gün görünümüne geç
      onDayClick(days[minIdx]);
    } else {
      // Çoklu gün seçimi — görev oluştur
      onRangeSelect(days[minIdx], days[maxIdx]);
    }
    setSelection(null);
  }, [selection, days, onDayClick, onRangeSelect]);

  const getTasksForDay = (day: Date) => {
    const ds = startOfDay(day).getTime();
    const de = ds + 86400000;
    return tasks.filter(t => t.startTime < de && t.endTime > ds);
  };

  return (
    <div
      className="month-view"
      onMouseUp={handleMouseUp}
      onMouseLeave={() => { if (isDragging.current) { isDragging.current = false; setSelection(null); } }}
    >
      <div className="month-grid">
        {WEEK_DAYS.map(d => (
          <div key={d} className="month-day-header">{d}</div>
        ))}
        {days.map((day, i) => {
          const dayTasks = getTasksForDay(day);
          const inMonth = isSameMonth(day, currentDate);
          const isSelected = selBounds && i >= selBounds.min && i <= selBounds.max;
          return (
            <div
              key={i}
              className={`month-day ${!inMonth ? 'other-month' : ''} ${isToday(day) ? 'today' : ''} ${isSelected ? 'selecting' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); handleMouseDown(i); }}
              onMouseEnter={() => handleMouseEnter(i)}
            >
              <div className="month-day-num">{format(day, 'd')}</div>
              {dayTasks.map(t => (
                <div key={t.id} className="month-day-task" style={{ backgroundColor: t.color }}>
                  {t.title}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
