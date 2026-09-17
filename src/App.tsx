import { Dumbbell } from 'lucide-react'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import Coach from '@/pages/Coach'
import Dashboard from '@/pages/Dashboard'
import FormCheck from '@/pages/FormCheck'
import Notifications from '@/pages/Notifications'
import Nutrition from '@/pages/Nutrition'
import Onboarding from '@/pages/Onboarding'
import Profile from '@/pages/Profile'
import Progress from '@/pages/Progress'
import Settings from '@/pages/Settings'
import Subscription from '@/pages/Subscription'
import WorkoutDetail from '@/pages/workouts/WorkoutDetail'
import WorkoutPlayer from '@/pages/workouts/WorkoutPlayer'
import WorkoutsList from '@/pages/workouts/WorkoutsList'
import { useAuthStore } from '@/store/useAuthStore'

function SplashScreen() {
  return (
    <div className="min-h-dvh grid place-items-center bg-bg">
      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent grid place-items-center text-[var(--ink-on-brand)] animate-[splash-zoom_1.2s_ease-in-out_infinite]">
        <Dumbbell size={30} strokeWidth={2.5} />
      </div>
    </div>
  )
}

function RequireAuth({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status)
  if (status === 'loading') return <SplashScreen />
  if (status === 'guest') return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status)
  if (status === 'loading') return <SplashScreen />
  if (status === 'authenticated') return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  const bootstrap = useAuthStore((state) => state.bootstrap)

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  return (
    <Routes>
      <Route
        path="/onboarding"
        element={
          <RedirectIfAuthed>
            <Onboarding />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/auth/login"
        element={
          <RedirectIfAuthed>
            <Login />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/auth/register"
        element={
          <RedirectIfAuthed>
            <Register />
          </RedirectIfAuthed>
        }
      />

      <Route
        path="/workouts/:workoutId/play"
        element={
          <RequireAuth>
            <WorkoutPlayer />
          </RequireAuth>
        }
      />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="/workouts" element={<WorkoutsList />} />
        <Route path="/workouts/:workoutId" element={<WorkoutDetail />} />
        <Route path="/nutrition" element={<Nutrition />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/coach" element={<Coach />} />
        <Route path="/form-check" element={<FormCheck />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
