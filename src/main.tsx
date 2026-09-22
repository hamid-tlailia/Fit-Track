import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'

import App from './App.tsx'
import i18n, { applyDocumentDirection } from './i18n'
import './index.css'
import { applyColorMode, applyTheme } from './lib/themes'
import { useAppStore } from './store/useAppStore'

applyDocumentDirection(i18n.language)
applyTheme(useAppStore.getState().theme)
const systemDark = window.matchMedia('(prefers-color-scheme: dark)')
const syncAppearance = () => {
  const { theme, colorMode } = useAppStore.getState()
  applyTheme(theme)
  applyColorMode(colorMode, systemDark.matches)
}
syncAppearance()
systemDark.addEventListener('change', syncAppearance)
useAppStore.subscribe(syncAppearance)

if (import.meta.env.PROD) {
  registerSW({ immediate: true })
  // The service worker skips waiting and claims clients as soon as a new
  // version installs (see sw.ts), but that alone doesn't refresh a tab
  // that's already open — it keeps running the JS/CSS it already loaded
  // until something reloads it, so a session can be left showing a stale
  // build indefinitely. Reload once the new worker actually takes control.
  let reloadedForUpdate = false
  navigator.serviceWorker?.addEventListener('controllerchange', () => {
    if (reloadedForUpdate) return
    reloadedForUpdate = true
    window.location.reload()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
