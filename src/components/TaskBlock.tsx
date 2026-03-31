import type { Task } from '../types';
import { hexToRgba, getContrastColor } from '../utils/colors';
import { formatTime } from '../utils/date';

interface Props {
  task: Task;
  dayStart: number;
  onClick: (task: Task) => void;
  colIndex?: number;
  totalCols?: number;
}

export default function TaskBlock({ task, dayStart, onClick, colIndex = 0, totalCols = 1 }: Props) {
  const startMin = Math.max(0, (task.startTime - dayStart) / 60000);
  const endMin = Math.min(24 * 60, (task.endTime - dayStart) / 60000);
  const top = (startMin / 60) * 60;
  const height = Math.max(16, ((endMin - startMin) / 60) * 60);

  const bg = hexToRgba(task.color, 0.25);
  const textColor = getContrastColor(task.color) === '#FFF' ? '#fff' : task.color;

  const widthPct = 100 / totalCols;
  const leftPct = colIndex * widthPct;

  return (
    <div
      className={`task-block ${task.isCompleted ? 'completed' : ''}`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        backgroundColor: bg,
        borderLeftColor: task.color,
        color: textColor,
        left: `${leftPct}%`,
        width: `calc(${widthPct}% - 4px)`,
      }}
      onClick={(e) => { e.stopPropagation(); onClick(task); }}
    >
      <div className="task-block-title">{task.title}</div>
      {height > 28 && (
        <div className="task-block-time">
          {formatTime(new Date(task.startTime))} - {formatTime(new Date(task.endTime))}
        </div>
      )}
    </div>
  );
}
