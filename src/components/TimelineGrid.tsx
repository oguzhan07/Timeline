import { useMemo, useState, useCallback, useRef } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useTaskStore } from '../store/taskStore';
import { HOURS, formatHour, formatDayName, getDaysOfWeek } from '../utils/date';
import { isToday, startOfDay, format } from 'date-fns';
import TaskBlock from './TaskBlock';
import CurrentTimeLine from './CurrentTimeLine';
import type { Task } from '../types';

interface Selection {
  startDayIdx: number;
  startHour: number;
  endDayIdx: number;
  endHour: number;
}

interface Props {
  onSelectionComplete: (startDate: Date, endDate: Date, startHour: number, endHour: number) => void;
  onTaskClick: (task: Task) => void;
}

export default function TimelineGrid({ onSelectionComplete, onTaskClick }: Props) {
  const { viewMode, currentDate } = useSettingsStore();
  const showCompleted = useSettingsStore(s => s.showCompletedTasks);
  const allTasks = useTaskStore(s => s.tasks);
  const filteredTasks = showCompleted ? allTasks : allTasks.filter(t => !t.isCompleted);

  const days = useMemo(() => {
    if (viewMode === 'day') return [currentDate];
    return getDaysOfWeek(currentDate);
  }, [viewMode, currentDate]);

  const [selection, setSelection] = useState<Selection | null>(null);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback((dayIdx: number, hour: number) => {
    isDragging.current = true;
    setSelection({ startDayIdx: dayIdx, startHour: hour, endDayIdx: dayIdx, endHour: hour });
  }, []);

  const handleMouseEnter = useCallback((dayIdx: number, hour: number) => {
    if (!isDragging.current) return;
    setSelection(prev => {
      if (!prev) return prev;
      return { ...prev, endDayIdx: dayIdx, endHour: hour };
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current || !selection) {
      isDragging.current = false;
      setSelection(null);
      return;
    }
    isDragging.current = false;

    const minDay = Math.min(selection.startDayIdx, selection.endDayIdx);
    const maxDay = Math.max(selection.startDayIdx, selection.endDayIdx);
    const minHour = Math.min(selection.startHour, selection.endHour);
    const maxHour = Math.max(selection.startHour, selection.endHour);

    const startDate = days[minDay];
    const endDate = days[maxDay];

    onSelectionComplete(startDate, endDate, minHour, maxHour + 1);
    setSelection(null);
  }, [selection, days, onSelectionComplete]);

  // Compute normalized selection bounds for highlighting
  const selBounds = useMemo(() => {
    if (!selection) return null;
    return {
      minDay: Math.min(selection.startDayIdx, selection.endDayIdx),
      maxDay: Math.max(selection.startDayIdx, selection.endDayIdx),
      minHour: Math.min(selection.startHour, selection.endHour),
      maxHour: Math.max(selection.startHour, selection.endHour),
    };
  }, [selection]);

  const getTasksForDay = (day: Date) => {
    const ds = startOfDay(day).getTime();
    const de = ds + 86400000;
    return filteredTasks.filter(t => t.startTime < de && t.endTime > ds);
  };

  const isCellSelected = (dayIdx: number, hour: number) => {
    if (!selBounds) return false;
    return dayIdx >= selBounds.minDay && dayIdx <= selBounds.maxDay
      && hour >= selBounds.minHour && hour <= selBounds.maxHour;
  };

  return (
    <div
      className="timeline-wrapper"
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        if (isDragging.current) {
          isDragging.current = false;
          setSelection(null);
        }
      }}
    >
      {/* Header */}
      <div className="timeline-header">
        <div className="timeline-header-gutter" />
        <div className="timeline-header-days">
          {days.map((day, i) => (
            <div key={i} className={`timeline-header-day ${isToday(day) ? 'today' : ''}`}>
              {formatDayName(day)}
              <span className="day-num">{format(day, 'd')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="timeline-body">
        {/* Hour labels */}
        <div className="timeline-hours">
          {HOURS.map(h => (
            <div key={h} className="timeline-hour-label">{formatHour(h)}</div>
          ))}
        </div>

        {/* Day columns */}
        <div className="timeline-grid">
          {days.map((day, dayIdx) => {
            const dayStart = startOfDay(day).getTime();
            const dayTasks = getTasksForDay(day);

            return (
              <div key={dayIdx} className="timeline-day-col">
                {isToday(day) && <CurrentTimeLine />}
                {dayTasks.map(task => (
                  <TaskBlock key={task.id} task={task} dayStart={dayStart} onClick={onTaskClick} />
                ))}
                {HOURS.map(h => (
                  <div
                    key={h}
                    className={`timeline-cell ${isCellSelected(dayIdx, h) ? 'selecting' : ''}`}
                    onMouseDown={(e) => { e.preventDefault(); handleMouseDown(dayIdx, h); }}
                    onMouseEnter={() => handleMouseEnter(dayIdx, h)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
