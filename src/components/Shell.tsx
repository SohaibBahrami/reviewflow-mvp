import type { ReactNode } from 'react'
import type { Theme } from '../lib/theme'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'

type Props = {
  children: ReactNode
  active: string
  theme: Theme
  clientMode?: boolean
  onNavigate: (path: string) => void
  onToggleTheme: () => void
}

export function Shell({ children, active, theme, clientMode = false, onNavigate, onToggleTheme }: Props) {
  const links = [
    ['/', 'Projects'],
    ['/new', 'Create project'],
  ] as const

  return (
    <div className={clientMode ? 'app-shell client-shell' : 'app-shell'}>
      <header className="topbar">
        <div className="topbar-inner">
          <Logo onNavigate={() => onNavigate('/')} />

          {clientMode ? (
            <div className="client-mode-label">
              <span className="client-mode-dot" aria-hidden="true" />
              Client review
            </div>
          ) : (
            <nav className="main-nav" aria-label="Primary">
              {links.map(([href, label]) => (
                <button
                  key={href}
                  className={active === href ? 'nav-link active' : 'nav-link'}
                  onClick={() => onNavigate(href)}
                >
                  {label}
                </button>
              ))}
            </nav>
          )}

          <div className="topbar-actions">
            {!clientMode && <div className="topbar-badge">Local prototype</div>}
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
        </div>
      </header>
      <main className="page-wrap">{children}</main>
    </div>
  )
}
