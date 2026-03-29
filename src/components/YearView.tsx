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

  // Drag state: tracks which month card and which day indices
  const [selection, setSelection] = useState<{ monthIdx: number; startIdx: number; endIdx: number } | null>(null);
  const isDragging = useRef(false);

  const selBounds = useMemo(() => {
    if (!selection) return null;
    return {
      monthIdx: selection.monthIdx,
      min: Math.min(selection.startIdx, selection.endIdx),
      max: Math.max(selection.startIdx, selection.endIdx),
    };
  }, [selection]);

  const handleDayMouseDown = useCallback((monthIdx: number, dayIdx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    setSelection({ monthIdx, startIdx: dayIdx, endIdx: dayIdx });
  }, []);

  const handleDayMouseEnter = useCallback((monthIdx: number, dayIdx: number) => {
    if (!isDragging.current) return;
    setSelection(prev => {
      if (!prev || prev.monthIdx !== monthIdx) return prev;
      return { ...prev, endIdx: dayIdx };
    });
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
        const d = new Date(t.startTime);
        taskDays.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      });

      return { month: m, name: format(monthDate, 'MMMM', { locale: tr }), days, taskDays, monthDate };
    });
  }, [year, tasks]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current || !selection) {
      isDragging.current = false;
      setSelection(null);
      return;
    }
    isDragging.current = false;

    const month = months[selection.monthIdx];
    const minIdx = Math.min(selection.startIdx, selection.endIdx);
    const maxIdx = Math.max(selection.startIdx, selection.endIdx);

    if (minIdx === maxIdx) {
      // Tek gün — o gün için görev oluştur
      onRangeSelect(month.days[minIdx], month.days[minIdx]);
    } else {
      onRangeSelect(month.days[minIdx], month.days[maxIdx]);
    }
    setSelection(null);
  }, [selection, months, onRangeSelect]);

  const handleCardClick = useCallback((month: number) => {
    // Sadece drag yapılmadıysa ay görünümüne geç
    if (!isDragging.current && !selection) {
      onMonthClick(month);
    }
  }, [onMonthClick, selection]);

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
                const isSelected = selBounds && selBounds.monthIdx === month && i >= selBounds.min && i <= selBounds.max;
                return (
                  <div
                    key={i}
                    className={`year-mini-day ${hasTasks ? 'has-tasks' : ''} ${isToday(day) ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                    style={{ opacity: inMonth ? 1 : 0.2, cursor: inMonth ? 'pointer' : 'default' }}
                    onMouseDown={(e) => inMonth && handleDayMouseDown(month, i, e)}
                    onMouseEnter={() => inMonth && handleDayMouseEnter(month, i)}
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
