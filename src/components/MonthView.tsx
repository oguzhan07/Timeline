import { useMemo } from 'react';
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
}

export default function MonthView({ onDayClick }: Props) {
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

  const getTasksForDay = (day: Date) => {
    const ds = startOfDay(day).getTime();
    const de = ds + 86400000;
    return tasks.filter(t => t.startTime < de && t.endTime > ds);
  };

  return (
    <div className="month-view">
      <div className="month-grid">
        {WEEK_DAYS.map(d => (
          <div key={d} className="month-day-header">{d}</div>
        ))}
        {days.map((day, i) => {
          const dayTasks = getTasksForDay(day);
          const inMonth = isSameMonth(day, currentDate);
          return (
            <div
              key={i}
              className={`month-day ${!inMonth ? 'other-month' : ''} ${isToday(day) ? 'today' : ''}`}
              onClick={() => onDayClick(day)}
            >
              <div className="month-day-num">{format(day, 'd')}</div>
              {dayTasks.slice(0, 3).map(t => (
                <div key={t.id} className="month-day-task" style={{ backgroundColor: t.color }}>
                  {t.title}
                </div>
              ))}
              {dayTasks.length > 3 && (
                <div className="month-day-more">+{dayTasks.length - 3} daha</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
