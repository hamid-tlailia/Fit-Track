# Fit Track

A bilingual (Arabic/English) fitness & health tracking web app — workouts with
voice-guided coaching, nutrition logging, progress analytics, and a
subscription system that unlocks AI-powered features.

This is a frontend-first build: everything currently runs client-side with
local persistence (`localStorage` via Zustand). A real backend/API is planned
as the final phase.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (CSS-variable based theming)
- React Router
- Zustand (persisted state)
- react-i18next (Arabic/English, RTL/LTR)
- Recharts (progress charts)
- Web Speech API (voice-guided workout cues)
- vite-plugin-pwa (installable, offline-capable)

## Features implemented so far

- Onboarding flow (language, gender, goal)
- Mock local auth (register/login — no backend yet)
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

## Roadmap

- Real backend/API + persistent accounts (deliberately last)
- AI coach chat, camera-based form checking, adaptive programs
- Wearable device integrations
