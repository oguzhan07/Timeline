import { useEffect } from 'react';
import { useNoteStore } from '../store/noteStore';
import { formatDateTime } from '../utils/date';
import type { Note } from '../types';

interface Props {
  onNoteClick: (note: Note) => void;
}

export default function NotesPage({ onNoteClick }: Props) {
  const { notes, loadNotes, deleteNote } = useNoteStore();

  useEffect(() => { loadNotes(); }, []);

  const sorted = [...notes].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="notes-page">
      {sorted.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-text">Henuz not yok</div>
        </div>
      ) : (
        sorted.map(note => (
          <div
            key={note.id}
            className="note-card"
            style={{ borderLeftColor: note.color }}
            onClick={() => onNoteClick(note)}
          >
            <div className="note-content">{note.content}</div>
            <div className="note-meta">
              <span>{formatDateTime(new Date(note.createdAt))}</span>
              {note.timeStart && note.timeEnd && (
                <span>
                  {formatDateTime(new Date(note.timeStart))} - {formatDateTime(new Date(note.timeEnd))}
                </span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                style={{ color: 'var(--danger)', cursor: 'pointer', background: 'none', border: 'none', font: 'inherit' }}
              >
                Sil
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
