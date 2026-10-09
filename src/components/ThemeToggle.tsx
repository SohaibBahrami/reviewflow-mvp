import type { Theme } from '../lib/theme'
import { useI18n } from '../lib/i18n'

interface Props {
  theme: Theme
  onToggle: () => void
}

export function ThemeToggle({ theme, onToggle }: Props) {
  const { t } = useI18n()
  const nextLabel = theme === 'dark' ? t('Light mode') : t('Dark mode')
  return (
    <button className="theme-toggle" type="button" onClick={onToggle} aria-label={t('Switch to {mode}', { mode: nextLabel })}>
      <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
      <span>{nextLabel}</span>
    </button>
  )
}
