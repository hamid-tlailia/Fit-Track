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
- Five selectable workout accent themes plus light/dark/system appearance
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

## AI and device configuration

- Set `GEMINI_API_KEY` **on the server** for coaching, training/nutrition plans,
  and AI reminders. `GEMINI_MODEL` can override the default `gemini-3.8-flash`
  with a model available to your Google project. `GOOGLE_API_KEY` is also
  accepted as a compatibility fallback. Both chat and plans share the same
  client, a 50-second provider timeout, and explicit configuration/service
  errors. Never expose these variables through a `VITE_` prefix.
- The AI functions have a 60-second Vercel budget. Plain `npm run dev` serves
  the frontend only; use `vercel dev` with your database and server environment
  for live authenticated integration testing.
- Google Fit requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, and the
  OAuth callback `/api/fit?action=callback` on the deployed origin. Existing
  connections must be disconnected/reconnected to grant the new heart-rate
  and location permissions. The Google project/API and the connected device
  must actually supply the requested data. Missing readings remain unavailable,
  not synthetic zeroes; optional sensor failures do not disable steps/calories.

## Activity and appearance

- Daily totals use the local calendar date. Workout streaks count unique
  completed-workout days and remain valid through today if yesterday was active.
- Google Fit total energy includes resting metabolism. Home separately labels
  that total and estimates active energy by subtracting elapsed resting energy
  (Mifflin–St Jeor BMR); it does not add overlapping local workout estimates.
- Guided sessions save actual unpaused elapsed time and a duration-scaled
  calorie estimate, not the full catalog calories for a skipped session. Failed
  saves expose retry rather than reporting success. Historical saved estimates
  are not rewritten because actual historical durations cannot be reconstructed.
- Heart rate is the daily average, not a live medical measurement. Distance
  and heart rate require real synced readings. Progress has no demo/random data.
- Light, midnight dark, and device-system appearance are available independently
  of the accent theme. The system setting follows live OS changes and persists.
- Training and nutrition share the AI plan/PDF component. The PDF button opens
  a print-friendly document; select **Save as PDF** in the browser print dialog.
  Plans are fetched in the selected app language.
- Subscription selection is still a demo: the one-month trial label is shown,
  but no payment, automatic billing, or trial-expiration engine is implemented.

## Verification

```bash
npm test
npm run lint
npm run build
npx tsc -p tsconfig.api.json
```

Unit tests cover local-day streak boundaries, active-calorie estimates, sensor
aggregation/unavailable readings, shared Gemini configuration and errors, and
Arabic/English key parity, in addition to existing calculation/voice/pose tests.
