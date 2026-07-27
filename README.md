# Time Tracker

A Vue 3 single-page app for tracking billable hours across clients and projects, built to replace manual spreadsheet tracking.

Backend: [timetracker-api](https://github.com/vytasilj/timetracker-api)

Live demo: https://vytasilj.github.io/timetracker-app/

## Features

- Manage clients, projects and time entries
- Two ways to log time: enter hours directly, or start/end time with optional lunch break deduction
- Light/dark theme, persisted per device, respects system preference by default
- JWT-based authentication with automatic token attachment and session handling

## Tech stack

- Vue 3 (Composition API, `<script setup>`)
- TypeScript
- Vite
- Pinia (state management)
- Vue Router (hash mode, for static hosting compatibility with GitHub Pages)
- Tailwind CSS v4
- Axios

## Getting started

**Prerequisites:** Node.js 20+

```bash
git clone https://github.com/vytasilj/timetracker-app.git
cd timetracker-app
npm install

# Point the app at your local API instance
echo "VITE_API_BASE_URL=http://localhost:5227" > .env.development

npm run dev
```

## Build & deployment

```bash
npm run build
```

Deployment to GitHub Pages happens automatically via GitHub Actions on every push to `main` (see `.github/workflows/deploy.yml`).