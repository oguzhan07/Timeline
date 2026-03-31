import { useState, useEffect, useCallback } from 'react';
import { useSettingsStore } from './store/settingsStore';
import { useTaskStore } from './store/taskStore';
import { useNoteStore } from './store/noteStore';
import type { Task, Note } from './types';
import Header from './components/Header';
import TimelineGrid from './components/TimelineGrid';
import MonthView from './components/MonthView';
import YearView from './components/YearView';
import TaskList from './components/TaskList';
import NotesPage from './components/NotesPage';
import SettingsPage from './components/SettingsPage';
import TaskForm from './components/TaskForm';

type Page = 'calendar' | 'tasks' | 'notes' | 'settings';

function App() {
  const { viewMode, setViewMode, setCurrentDate, colorScheme } = useSettingsStore();
  const loadTasks = useTaskStore(s => s.loadTasks);
  const loadNotes = useNoteStore(s => s.loadNotes);

  const [page, setPage] = useState<Page>('calendar');
  const [fabOpen, setFabOpen] = useState(false);

  // Modal state
  const [modal, setModal] = useState<{
    mode: 'task' | 'note';
    editTask?: Task | null;
    editNote?: Note | null;
    defaultStartDate?: Date;
    defaultEndDate?: Date;
    defaultStartHour?: number;
    defaultEndHour?: number;
  } | null>(null);

  useEffect(() => {
    loadTasks();
    loadNotes();
  }, []);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorScheme);
  }, [colorScheme]);

  const handleSelectionComplete = useCallback((startDate: Date, endDate: Date, startHour: number, endHour: number) => {
    setModal({
      mode: 'task',
      defaultStartDate: startDate,
      defaultEndDate: endDate,
      defaultStartHour: startHour,
      defaultEndHour: endHour,
    });
  }, []);

  const handleTaskClick = useCallback((task: Task) => {
    setModal({ mode: 'task', editTask: task });
  }, []);

  const handleNoteClick = useCallback((note: Note) => {
    setModal({ mode: 'note', editNote: note });
  }, []);

  const handleDayClick = useCallback((date: Date) => {
    setCurrentDate(date);
    setViewMode('day');
  }, [setCurrentDate, setViewMode]);

  const handleMonthClick = useCallback((month: number) => {
    const d = new Date(useSettingsStore.getState().currentDate);
    d.setMonth(month);
    setCurrentDate(d);
    setViewMode('month');
  }, [setCurrentDate, setViewMode]);

  const handleRangeSelect = useCallback((startDate: Date, endDate: Date) => {
    setModal({
      mode: 'task',
      defaultStartDate: startDate,
      defaultEndDate: endDate,
      defaultStartHour: 9,
      defaultEndHour: 10,
    });
  }, []);

  const PAGES: { key: Page; label: string; icon: string }[] = [
    { key: 'calendar', label: 'Takvim', icon: '📅' },
    { key: 'tasks', label: 'Gorevler', icon: '✅' },
    { key: 'notes', label: 'Notlar', icon: '📝' },
    { key: 'settings', label: 'Ayarlar', icon: '⚙️' },
  ];

  return (
    <>
      <Header />

      <div className="page-tabs">
        {PAGES.map(p => (
          <button
            key={p.key}
            className={`page-tab ${page === p.key ? 'active' : ''}`}
            onClick={() => setPage(p.key)}
          >
            <span>{p.icon}</span>
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      <div className="main-content">
        {page === 'calendar' && (
          <>
            {(viewMode === 'day' || viewMode === 'week') && (
              <TimelineGrid onSelectionComplete={handleSelectionComplete} onTaskClick={handleTaskClick} />
            )}
            {viewMode === 'month' && <MonthView onDayClick={handleDayClick} onRangeSelect={handleRangeSelect} />}
            {viewMode === 'year' && <YearView onMonthClick={handleMonthClick} onRangeSelect={handleRangeSelect} />}
          </>
        )}
        {page === 'tasks' && <TaskList onTaskClick={handleTaskClick} />}
        {page === 'notes' && (
          <NotesPage onNoteClick={handleNoteClick} />
        )}
        {page === 'settings' && <SettingsPage />}
      </div>

      {/* FAB */}
      {(page === 'calendar' || page === 'tasks' || page === 'notes') && (
        <div className="fab-container">
          {fabOpen && (
            <div className="fab-menu">
              <button className="fab-menu-item" onClick={() => { setFabOpen(false); setModal({ mode: 'task' }); }}>
                <span>✅</span> Gorev Ekle
              </button>
              <button className="fab-menu-item" onClick={() => { setFabOpen(false); setModal({ mode: 'note' }); }}>
                <span>📝</span> Not Ekle
              </button>
            </div>
          )}
          <button
            className={`fab ${fabOpen ? 'fab-open' : ''}`}
            onClick={() => {
              if (page === 'notes') { setModal({ mode: 'note' }); }
              else if (page === 'tasks') { setModal({ mode: 'task' }); }
              else { setFabOpen(!fabOpen); }
            }}
          >
            +
          </button>
        </div>
      )}
      {fabOpen && <div className="fab-backdrop" onClick={() => setFabOpen(false)} />}

      {/* Modal */}
      {modal && (
        <TaskForm
          mode={modal.mode}
          editTask={modal.editTask}
          editNote={modal.editNote}
          defaultStartDate={modal.defaultStartDate}
          defaultEndDate={modal.defaultEndDate}
          defaultStartHour={modal.defaultStartHour}
          defaultEndHour={modal.defaultEndHour}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

export default App;
