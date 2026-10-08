export type Theme = 'dark' | 'light'

const THEME_KEY = 'reviewflow-theme'

export function getTheme(): Theme {
  const saved = window.localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}

export function setTheme(theme: Theme) {
  window.localStorage.setItem(THEME_KEY, theme)
  applyTheme(theme)
}

export function toggleTheme(current: Theme): Theme {
  const next = current === 'dark' ? 'light' : 'dark'
  setTheme(next)
  return next
}
