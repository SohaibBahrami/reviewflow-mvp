import type { Theme } from '../lib/theme'

interface Props {
  theme: Theme
  onToggle: () => void
}

export function ThemeToggle({ theme, onToggle }: Props) {
  const nextLabel = theme === 'dark' ? 'Light mode' : 'Dark mode'

  return (
    <button className="theme-toggle" type="button" onClick={onToggle} aria-label={`Switch to ${nextLabel.toLowerCase()}`}>
      <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
      <span>{nextLabel}</span>
    </button>
  )
}
