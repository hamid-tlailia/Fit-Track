import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import Dashboard from '@/pages/Dashboard'
import Nutrition from '@/pages/Nutrition'
import Onboarding from '@/pages/Onboarding'
import Profile from '@/pages/Profile'
import Progress from '@/pages/Progress'
import Settings from '@/pages/Settings'
import Subscription from '@/pages/Subscription'
import WorkoutDetail from '@/pages/workouts/WorkoutDetail'
import WorkoutPlayer from '@/pages/workouts/WorkoutPlayer'
import WorkoutsList from '@/pages/workouts/WorkoutsList'
import { useAppStore } from '@/store/useAppStore'

function RequireOnboarding({ children }: { children: ReactNode }) {
  const onboardingComplete = useAppStore((state) => state.onboardingComplete)
  if (!onboardingComplete) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function RedirectIfOnboarded({ children }: { children: ReactNode }) {
  const onboardingComplete = useAppStore((state) => state.onboardingComplete)
  if (onboardingComplete) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/onboarding"
        element={
          <RedirectIfOnboarded>
            <Onboarding />
          </RedirectIfOnboarded>
        }
      />
      <Route
        path="/auth/login"
        element={
          <RedirectIfOnboarded>
            <Login />
          </RedirectIfOnboarded>
        }
      />
      <Route
        path="/auth/register"
        element={
          <RedirectIfOnboarded>
            <Register />
          </RedirectIfOnboarded>
        }
      />

      <Route
        element={
          <RequireOnboarding>
            <AppLayout />
          </RequireOnboarding>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="/workouts" element={<WorkoutsList />} />
        <Route path="/workouts/:workoutId" element={<WorkoutDetail />} />
        <Route path="/workouts/:workoutId/play" element={<WorkoutPlayer />} />
        <Route path="/nutrition" element={<Nutrition />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
