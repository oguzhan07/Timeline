import { useMemo } from 'react';
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
}

export default function YearView({ onMonthClick }: Props) {
  const currentDate = useSettingsStore(s => s.currentDate);
  const tasks = useTaskStore(s => s.tasks);
  const year = currentDate.getFullYear();

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

      return {
        month: m,
        name: format(monthDate, 'MMMM', { locale: tr }),
        days,
        taskDays,
        monthDate,
      };
    });
  }, [year, tasks]);

  return (
    <div className="year-view">
      <div className="year-grid">
        {months.map(({ month, name, days, taskDays }) => (
          <div
            key={month}
            className="year-month-card"
            onClick={() => onMonthClick(month)}
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
                return (
                  <div
                    key={i}
                    className={`year-mini-day ${hasTasks ? 'has-tasks' : ''} ${isToday(day) ? 'today' : ''}`}
                    style={{ opacity: inMonth ? 1 : 0.2 }}
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
