import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'

import App from './App.tsx'
import i18n, { applyDocumentDirection } from './i18n'
import './index.css'
import { applyTheme } from './lib/themes'
import { useAppStore } from './store/useAppStore'

applyDocumentDirection(i18n.language)
applyTheme(useAppStore.getState().theme)

if (import.meta.env.PROD) registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
