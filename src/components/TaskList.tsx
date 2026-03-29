import { useState, useMemo } from 'react';
import { useTaskStore } from '../store/taskStore';
import { PRIORITY_COLORS } from '../utils/colors';
import { formatDateTime } from '../utils/date';
import type { Task } from '../types';

interface Props {
  onTaskClick: (task: Task) => void;
}

type Filter = 'all' | 'today' | 'upcoming' | 'completed';

export default function TaskList({ onTaskClick }: Props) {
  const tasks = useTaskStore(s => s.tasks);
  const toggleComplete = useTaskStore(s => s.toggleComplete);
  const deleteTask = useTaskStore(s => s.deleteTask);
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    const now = Date.now();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    let list = [...tasks];
    switch (filter) {
      case 'today':
        list = list.filter(t => t.startTime < todayEnd.getTime() && t.endTime > todayStart.getTime());
        break;
      case 'upcoming':
        list = list.filter(t => t.startTime > now && !t.isCompleted);
        break;
      case 'completed':
        list = list.filter(t => t.isCompleted);
        break;
    }
    return list.sort((a, b) => a.startTime - b.startTime);
  }, [tasks, filter]);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Tumunu' },
    { key: 'today', label: 'Bugun' },
    { key: 'upcoming', label: 'Yaklasan' },
    { key: 'completed', label: 'Tamamlanan' },
  ];

  return (
    <div className="task-list-page">
      <div className="task-list-filters">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`filter-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">Gorev bulunamadi</div>
        </div>
      ) : (
        filtered.map(task => (
          <div key={task.id} className="task-item" onClick={() => onTaskClick(task)}>
            <div className="task-item-color" style={{ backgroundColor: task.color }} />
            <div
              className={`task-item-check ${task.isCompleted ? 'checked' : ''}`}
              onClick={(e) => { e.stopPropagation(); toggleComplete(task.id); }}
            >
              {task.isCompleted ? '✓' : ''}
            </div>
            <div className="task-item-body">
              <div className={`task-item-title ${task.isCompleted ? 'completed' : ''}`}>
                {task.title}
              </div>
              <div className="task-item-meta">
                {formatDateTime(new Date(task.startTime))} - {formatDateTime(new Date(task.endTime))}
                {task.isRecurring && ' 🔄'}
              </div>
            </div>
            <div className="task-item-priority" style={{ backgroundColor: PRIORITY_COLORS[task.priority] }} />
            <div className="task-item-actions">
              <button
                className="icon-btn danger"
                onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                title="Sil"
              >
                🗑
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
