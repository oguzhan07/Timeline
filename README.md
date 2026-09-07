# Timeline

A day planner I built for myself. I wanted one place to plan a day by hours, keep notes, and look
back at a month or a year to see what I actually did.

## What it does

- **Day view** — a grid of hours where tasks are blocks. A line shows the current time and moves
  as the day goes on.
- **Month and year views** — a wider look at what is planned and what is done.
- **Notes** — a separate page for notes that are not tied to one hour.
- **Settings** — colours and preferences for how the timeline looks.
- Data is saved to Firebase, so the same plan opens on any device I sign in from.

## Structure

```
src/
├── components/    TimelineGrid, TaskBlock, TaskForm, TaskList,
│                  MonthView, YearView, NotesPage, SettingsPage,
│                  CurrentTimeLine, Header
├── store/         taskStore, noteStore, settingsStore  (Zustand)
├── lib/           firebase.ts
├── utils/         date and colour helpers
└── types/         shared TypeScript types
```

State is split into three small Zustand stores instead of one big one, so a change to settings
does not re-render the task list.

## Built with

React 19 · TypeScript · Vite · Zustand · Firebase · React Router · date-fns

Deployed to GitHub Pages by a GitHub Actions workflow on every push to `main`.

## Running locally

```bash
npm install
cp .env.example .env.local   # add your own Firebase config
npm run dev
```

## Note

This is a personal tool, not a product. I built it for my own daily use.
