import { useState } from 'react';
import type { Task, Note, RecurrenceType } from '../types';
import { useTaskStore } from '../store/taskStore';
import { useNoteStore } from '../store/noteStore';
import { useSettingsStore } from '../store/settingsStore';
import { TASK_COLORS, PRIORITY_COLORS } from '../utils/colors';
import { format } from 'date-fns';

interface Props {
  mode: 'task' | 'note';
  editTask?: Task | null;
  editNote?: Note | null;
  defaultStartDate?: Date;
  defaultEndDate?: Date;
  defaultStartHour?: number;
  defaultEndHour?: number;
  onClose: () => void;
}

export default function TaskForm({ mode, editTask, editNote, defaultStartDate, defaultEndDate, defaultStartHour, defaultEndHour, onClose }: Props) {
  const addTask = useTaskStore(s => s.addTask);
  const updateTask = useTaskStore(s => s.updateTask);
  const deleteTask = useTaskStore(s => s.deleteTask);
  const addNote = useNoteStore(s => s.addNote);
  const updateNote = useNoteStore(s => s.updateNote);
  const deleteNote = useNoteStore(s => s.deleteNote);
  const defaultNotify = useSettingsStore(s => s.defaultNotifyBefore);

  // Task fields
  const [title, setTitle] = useState(editTask?.title || '');
  const [description, setDescription] = useState(editTask?.description || '');
  const [color, setColor] = useState(editTask?.color || editNote?.color || TASK_COLORS[0]);
  const [priority, setPriority] = useState<1 | 2 | 3 | 4 | 5>(editTask?.priority || 3);
  const [notifyBefore, setNotifyBefore] = useState(editTask?.notifyBefore ?? defaultNotify);
  const [isRecurring, setIsRecurring] = useState(editTask?.isRecurring || false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(editTask?.recurrenceRule?.type || 'none');
  const [recurrenceInterval, setRecurrenceInterval] = useState(editTask?.recurrenceRule?.interval || 1);

  // Note fields
  const [noteContent, setNoteContent] = useState(editNote?.content || '');

  // Date/time
  const now = new Date();
  const sDate = defaultStartDate || (editTask ? new Date(editTask.startTime) : now);
  const eDate = defaultEndDate || defaultStartDate || (editTask ? new Date(editTask.endTime) : now);
  const sHour = defaultStartHour ?? (editTask ? new Date(editTask.startTime).getHours() : now.getHours());
  const eHour = defaultEndHour ?? (editTask ? new Date(editTask.endTime).getHours() : Math.min(sHour + 1, 24));

  const [startDate, setStartDate] = useState(format(editTask ? new Date(editTask.startTime) : sDate, 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState(
    editTask
      ? format(new Date(editTask.startTime), 'HH:mm')
      : `${String(sHour).padStart(2, '0')}:00`
  );
  const [endDate, setEndDate] = useState(format(editTask ? new Date(editTask.endTime) : eDate, 'yyyy-MM-dd'));
  const [endTime, setEndTime] = useState(
    editTask
      ? format(new Date(editTask.endTime), 'HH:mm')
      : `${String(Math.min(eHour, 23)).padStart(2, '0')}:00`
  );

  // Note time
  const [noteStartDate, setNoteStartDate] = useState(
    editNote?.timeStart ? format(new Date(editNote.timeStart), 'yyyy-MM-dd') : format(sDate, 'yyyy-MM-dd')
  );
  const [noteStartTime, setNoteStartTime] = useState(
    editNote?.timeStart ? format(new Date(editNote.timeStart), 'HH:mm') : `${String(sHour).padStart(2, '0')}:00`
  );
  const [noteEndDate, setNoteEndDate] = useState(
    editNote?.timeEnd ? format(new Date(editNote.timeEnd), 'yyyy-MM-dd') : format(eDate, 'yyyy-MM-dd')
  );
  const [noteEndTime, setNoteEndTime] = useState(
    editNote?.timeEnd ? format(new Date(editNote.timeEnd), 'HH:mm') : `${String(Math.min(eHour, 23)).padStart(2, '0')}:00`
  );

  const handleSaveTask = async () => {
    if (!title.trim()) return;

    const start = new Date(`${startDate}T${startTime}`).getTime();
    const end = new Date(`${endDate}T${endTime}`).getTime();
    if (end <= start) return;

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      startTime: start,
      endTime: end,
      color,
      priority,
      isRecurring,
      recurrenceRule: isRecurring && recurrenceType !== 'none'
        ? { type: recurrenceType, interval: recurrenceInterval }
        : null,
      notifyBefore,
      isCompleted: editTask?.isCompleted || false,
    };

    if (editTask) {
      await updateTask(editTask.id, taskData);
    } else {
      await addTask(taskData);
    }
    onClose();
  };

  const handleSaveNote = async () => {
    if (!noteContent.trim()) return;

    const timeStart = new Date(`${noteStartDate}T${noteStartTime}`).getTime();
    const timeEnd = new Date(`${noteEndDate}T${noteEndTime}`).getTime();

    const noteData = {
      content: noteContent.trim(),
      taskId: editNote?.taskId || null,
      timeStart,
      timeEnd,
      color,
    };

    if (editNote) {
      await updateNote(editNote.id, noteData);
    } else {
      await addNote(noteData);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (mode === 'task' && editTask) {
      await deleteTask(editTask.id);
    } else if (mode === 'note' && editNote) {
      await deleteNote(editNote.id);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">
            {mode === 'task'
              ? (editTask ? 'Gorevi Duzenle' : 'Yeni Gorev')
              : (editNote ? 'Notu Duzenle' : 'Yeni Not')}
          </span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {mode === 'task' ? (
            <>
              <div className="form-group">
                <label className="form-label">Baslik</label>
                <input
                  className="form-input"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Gorev basligi..."
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Aciklama</label>
                <textarea
                  className="form-input form-textarea"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Aciklama (istege bagli)..."
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Baslangic Tarihi</label>
                  <input className="form-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Baslangic Saati</label>
                  <input className="form-input" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Bitis Tarihi</label>
                  <input className="form-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Bitis Saati</label>
                  <input className="form-input" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Renk</label>
                <div className="color-picker">
                  {TASK_COLORS.map(c => (
                    <div
                      key={c}
                      className={`color-swatch ${color === c ? 'selected' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Oncelik</label>
                <div className="priority-picker">
                  {([1, 2, 3, 4, 5] as const).map(p => (
                    <button
                      key={p}
                      className={`priority-btn ${priority === p ? 'selected' : ''}`}
                      style={{ backgroundColor: PRIORITY_COLORS[p], color: '#fff' }}
                      onClick={() => setPriority(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Hatirlatma</label>
                <select
                  className="form-input form-select"
                  value={notifyBefore}
                  onChange={e => setNotifyBefore(Number(e.target.value))}
                >
                  <option value={0}>Yok</option>
                  <option value={5}>5 dk once</option>
                  <option value={10}>10 dk once</option>
                  <option value={15}>15 dk once</option>
                  <option value={30}>30 dk once</option>
                  <option value={60}>1 saat once</option>
                </select>
              </div>

              <div className="setting-row" style={{ marginBottom: 16 }}>
                <div>
                  <div className="setting-label">Tekrarlayan Gorev</div>
                </div>
                <div
                  className={`toggle ${isRecurring ? 'on' : ''}`}
                  onClick={() => setIsRecurring(!isRecurring)}
                />
              </div>

              {isRecurring && (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Tekrar Tipi</label>
                    <select
                      className="form-input form-select"
                      value={recurrenceType}
                      onChange={e => setRecurrenceType(e.target.value as RecurrenceType)}
                    >
                      <option value="daily">Gunluk</option>
                      <option value="weekly">Haftalik</option>
                      <option value="monthly">Aylik</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Aralik</label>
                    <input
                      className="form-input"
                      type="number"
                      min={1}
                      value={recurrenceInterval}
                      onChange={e => setRecurrenceInterval(Number(e.target.value))}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Not Icerigi</label>
                <textarea
                  className="form-input form-textarea"
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  placeholder="Not yaz..."
                  autoFocus
                  style={{ minHeight: 120 }}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Baslangic</label>
                  <input className="form-input" type="date" value={noteStartDate} onChange={e => setNoteStartDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Saat</label>
                  <input className="form-input" type="time" value={noteStartTime} onChange={e => setNoteStartTime(e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Bitis</label>
                  <input className="form-input" type="date" value={noteEndDate} onChange={e => setNoteEndDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Saat</label>
                  <input className="form-input" type="time" value={noteEndTime} onChange={e => setNoteEndTime(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Renk</label>
                <div className="color-picker">
                  {TASK_COLORS.map(c => (
                    <div
                      key={c}
                      className={`color-swatch ${color === c ? 'selected' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          {(editTask || editNote) && (
            <button className="btn btn-danger" onClick={handleDelete}>Sil</button>
          )}
          <div style={{ flex: 1 }} />
          <button className="btn btn-secondary" onClick={onClose}>Iptal</button>
          <button className="btn btn-primary" onClick={mode === 'task' ? handleSaveTask : handleSaveNote}>
            {(editTask || editNote) ? 'Kaydet' : 'Olustur'}
          </button>
        </div>
      </div>
    </div>
  );
}
