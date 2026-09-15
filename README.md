# FitForge

A bilingual (Arabic/English) fitness & health tracking web app — workouts with
voice-guided coaching, nutrition logging, progress analytics, and a
subscription system that unlocks AI-powered features.

Real accounts, sessions, and per-user data are backed by a Postgres database
(Neon) through Vercel serverless functions under `/api`.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (CSS-variable based theming)
- React Router
- Zustand (client-side UI state)
- react-i18next (Arabic/English, RTL/LTR)
- Recharts (progress charts)
- Web Speech API (voice-guided workout cues)
- vite-plugin-pwa (installable, offline-capable)
- Vercel Functions + Postgres (Neon) — auth, sessions, per-user data

## Features implemented so far

- Onboarding flow (language, gender, goal)
- Real accounts: registration/login backed by Postgres, bcrypt-hashed
  passwords, httpOnly session cookies
- Dashboard with daily summary and quick actions
- Workout library with categories, detail screens, and an interactive
  player (timers, sets/reps, rest periods, voice cues in the user's
  language with a male/female voice preference)
- Nutrition logging with a calorie/macro calculator (Mifflin-St Jeor + TDEE)
- Progress tracking (weight chart, weekly activity chart, personal records)
- Subscription plans (Free / Premium / Pro) that gate AI-powered features
  behind a `PremiumGate` component
- Four selectable motivational workout themes
- Full Arabic/English localization with automatic RTL/LTR switching

## Getting started

```bash
npm install
npm run dev
```

The `/api` serverless functions require a `DATABASE_URL` (or `POSTGRES_URL`)
environment variable pointing at a Postgres database — they won't run without
it. On Vercel, connect a Postgres integration (e.g. Neon) under the project's
Storage tab; locally, set it in a `.env` file and use `vercel dev` to run the
functions alongside Vite.

## Roadmap

- AI coach chat, camera-based form checking, adaptive programs (needs an LLM
  API call, which must go through the backend rather than the client)
- Wearable device integrations
