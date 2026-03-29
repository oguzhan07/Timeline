import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAE7NFdDnGwZ1xj2WNJMfQDDh27U3BQfG8',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'timeline-b8fbb.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'timeline-b8fbb',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'timeline-b8fbb.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '703791658400',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:703791658400:web:4d8a14d07a42279bab20c5',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Collection references
export const tasksCollection = collection(db, 'tasks');
export const notesCollection = collection(db, 'notes');

export {
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
};
