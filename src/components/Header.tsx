import { useSettingsStore } from '../store/settingsStore';
import type { ViewMode } from '../types';
import { formatDate, formatMonthYear } from '../utils/date';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: 'day', label: 'Gun' },
  { key: 'week', label: 'Hafta' },
  { key: 'month', label: 'Ay' },
  { key: 'year', label: 'Yil' },
];

export default function Header() {
  const { viewMode, setViewMode, currentDate, navigateForward, navigateBackward, goToToday } =
    useSettingsStore();

  const title = (() => {
    switch (viewMode) {
      case 'day': return formatDate(currentDate);
      case 'week': return formatDate(currentDate);
      case 'month': return formatMonthYear(currentDate);
      case 'year': return format(currentDate, 'yyyy', { locale: tr });
    }
  })();

  return (
    <header className="header">
      <div className="header-left">
        <button className="today-btn" onClick={goToToday}>Bugun</button>
        <button className="nav-btn" onClick={navigateBackward}>&lsaquo;</button>
        <button className="nav-btn" onClick={navigateForward}>&rsaquo;</button>
        <span className="header-title">{title}</span>
      </div>
      <div className="header-right">
        <div className="view-tabs">
          {VIEW_MODES.map(v => (
            <button
              key={v.key}
              className={`view-tab ${viewMode === v.key ? 'active' : ''}`}
              onClick={() => setViewMode(v.key)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
