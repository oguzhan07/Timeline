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
  const updateTask = useTaskStore(s => s.updateTask);
  const filteredTasks = showCompleted ? allTasks : allTasks.filter(t => !t.isCompleted);
  const [dropTarget, setDropTarget] = useState<{ dayIdx: number; hour: number } | null>(null);

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

  // Compute column layout for overlapping tasks
  const computeColumns = (tasks: Task[]): { task: Task; col: number; totalCols: number }[] => {
    if (tasks.length === 0) return [];
    const sorted = [...tasks].sort((a, b) => a.startTime - b.startTime || a.endTime - b.endTime);
    const cols: { task: Task; col: number; group: number }[] = [];
    const groups: { end: number; maxCol: number; members: number[] }[] = [];

    for (const task of sorted) {
      // Find a column where this task doesn't overlap
      const endTimes: number[] = [];
      for (const placed of cols) {
        if (!endTimes[placed.col] || endTimes[placed.col] <= placed.task.endTime) {
          endTimes[placed.col] = placed.task.endTime;
        }
      }
      let col = 0;
      while (endTimes[col] && endTimes[col] > task.startTime) col++;

      // Find which group this task belongs to (overlaps with any member)
      let groupIdx = -1;
      for (let g = 0; g < groups.length; g++) {
        if (task.startTime < groups[g].end) {
          groupIdx = g;
          break;
        }
      }
      if (groupIdx === -1) {
        groupIdx = groups.length;
        groups.push({ end: task.endTime, maxCol: col, members: [] });
      } else {
        groups[groupIdx].end = Math.max(groups[groupIdx].end, task.endTime);
        groups[groupIdx].maxCol = Math.max(groups[groupIdx].maxCol, col);
      }
      groups[groupIdx].members.push(cols.length);
      cols.push({ task, col, group: groupIdx });
    }

    return cols.map(c => ({
      task: c.task,
      col: c.col,
      totalCols: groups[c.group].maxCol + 1,
    }));
  };

  const isCellSelected = (dayIdx: number, hour: number) => {
    if (!selBounds) return false;
    return dayIdx >= selBounds.minDay && dayIdx <= selBounds.maxDay
      && hour >= selBounds.minHour && hour <= selBounds.maxHour;
  };

  const handleDragOver = useCallback((e: React.DragEvent, dayIdx: number, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget({ dayIdx, hour });
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dayIdx: number, hour: number) => {
    e.preventDefault();
    setDropTarget(null);
    const taskId = e.dataTransfer.getData('taskId');
    const duration = parseInt(e.dataTransfer.getData('taskDuration'), 10);
    if (!taskId || isNaN(duration)) return;

    const targetDay = days[dayIdx];
    const newStart = startOfDay(targetDay).getTime() + hour * 3600000;
    const newEnd = newStart + duration;

    updateTask(taskId, { startTime: newStart, endTime: newEnd });
  }, [days, updateTask]);

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
            const layouted = computeColumns(dayTasks);

            return (
              <div key={dayIdx} className="timeline-day-col">
                {isToday(day) && <CurrentTimeLine />}
                {layouted.map(({ task, col, totalCols }) => (
                  <TaskBlock key={task.id} task={task} dayStart={dayStart} onClick={onTaskClick} colIndex={col} totalCols={totalCols} />
                ))}
                {HOURS.map(h => (
                  <div
                    key={h}
                    className={`timeline-cell ${isCellSelected(dayIdx, h) ? 'selecting' : ''} ${dropTarget?.dayIdx === dayIdx && dropTarget?.hour === h ? 'drop-target' : ''}`}
                    onMouseDown={(e) => { e.preventDefault(); handleMouseDown(dayIdx, h); }}
                    onMouseEnter={() => handleMouseEnter(dayIdx, h)}
                    onDragOver={(e) => handleDragOver(e, dayIdx, h)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dayIdx, h)}
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
