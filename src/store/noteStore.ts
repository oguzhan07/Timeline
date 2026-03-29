import { create } from 'zustand';
import type { Note } from '../types';
import { db, notesCollection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, orderBy } from '../lib/firebase';

function getLocalNotes(): Note[] {
  try { return JSON.parse(localStorage.getItem('tl_notes') || '[]'); } catch { return []; }
}
function setLocalNotes(notes: Note[]) {
  localStorage.setItem('tl_notes', JSON.stringify(notes));
}
const useFirebase = () => true;

interface NoteState {
  notes: Note[];
  isLoading: boolean;
  loadNotes: () => Promise<void>;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  getNotesForTask: (taskId: string) => Note[];
  getNotesForTimeRange: (start: number, end: number) => Note[];
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  isLoading: false,

  loadNotes: async () => {
    set({ isLoading: true });
    try {
      if (useFirebase()) {
        const q = query(notesCollection, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        set({ notes: snapshot.docs.map(d => d.data() as Note), isLoading: false });
      } else {
        set({ notes: getLocalNotes(), isLoading: false });
      }
    } catch (err) {
      console.warn('[Notes] Load error:', err);
      set({ notes: getLocalNotes(), isLoading: false });
    }
  },

  addNote: async (noteData) => {
    const now = Date.now();
    const newNote: Note = { ...noteData, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    set(s => ({ notes: [...s.notes, newNote] }));
    try { if (useFirebase()) await setDoc(doc(db, 'notes', newNote.id), newNote); } catch {}
    setLocalNotes(get().notes);
    return newNote;
  },

  updateNote: async (id, updates) => {
    const updatedAt = Date.now();
    set(s => ({ notes: s.notes.map(n => n.id === id ? { ...n, ...updates, updatedAt } : n) }));
    try { if (useFirebase()) await updateDoc(doc(db, 'notes', id), { ...updates, updatedAt }); } catch {}
    setLocalNotes(get().notes);
  },

  deleteNote: async (id) => {
    set(s => ({ notes: s.notes.filter(n => n.id !== id) }));
    try { if (useFirebase()) await deleteDoc(doc(db, 'notes', id)); } catch {}
    setLocalNotes(get().notes);
  },

  getNotesForTask: (taskId) => get().notes.filter(n => n.taskId === taskId),
  getNotesForTimeRange: (start, end) => get().notes.filter(n =>
    n.timeStart !== null && n.timeEnd !== null && n.timeStart < end && n.timeEnd! > start
  ),
}));
