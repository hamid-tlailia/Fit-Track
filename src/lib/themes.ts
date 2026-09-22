import type { ColorMode, ThemeId } from '@/store/useAppStore'

export interface ThemeDefinition {
  id: ThemeId
  nameKey: string
  descriptionKey: string
  swatch: [string, string]
}

export const themes: ThemeDefinition[] = [
  { id: 'energy', nameKey: 'themes.energy.name', descriptionKey: 'themes.energy.description', swatch: ['#FF6B2D', '#4A90E2'] },
  { id: 'warrior', nameKey: 'themes.warrior.name', descriptionKey: 'themes.warrior.description', swatch: ['#D97706', '#7C3AED'] },
  { id: 'calm', nameKey: 'themes.calm.name', descriptionKey: 'themes.calm.description', swatch: ['#059669', '#06B6D4'] },
  { id: 'neon', nameKey: 'themes.neon.name', descriptionKey: 'themes.neon.description', swatch: ['#E8457A', '#06D6A0'] },
]

export function applyTheme(theme: ThemeId) {
  if (theme === 'energy') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

export function applyColorMode(mode: ColorMode, systemDark: boolean) {
  document.documentElement.dataset.mode = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode
}
