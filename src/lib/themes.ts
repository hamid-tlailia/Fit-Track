import type { ThemeId } from '@/store/useAppStore'

export interface ThemeDefinition {
  id: ThemeId
  nameKey: string
  descriptionKey: string
  swatch: [string, string]
}

export const themes: ThemeDefinition[] = [
  { id: 'energy', nameKey: 'themes.energy.name', descriptionKey: 'themes.energy.description', swatch: ['#f84f14', '#22d3ee'] },
  { id: 'warrior', nameKey: 'themes.warrior.name', descriptionKey: 'themes.warrior.description', swatch: ['#8b5cf6', '#fbbf24'] },
  { id: 'calm', nameKey: 'themes.calm.name', descriptionKey: 'themes.calm.description', swatch: ['#10b981', '#60a5fa'] },
  { id: 'neon', nameKey: 'themes.neon.name', descriptionKey: 'themes.neon.description', swatch: ['#d21fff', '#39ffd6'] },
]

export function applyTheme(theme: ThemeId) {
  if (theme === 'energy') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', theme)
  }
}
