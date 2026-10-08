import type { ReactNode } from 'react'
import type { Theme } from '../lib/theme'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'

type Props = {
  children: ReactNode
  active: string
  theme: Theme
  clientMode?: boolean
  trashCount?: number
  onNavigate: (path: string) => void
  onToggleTheme: () => void
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
      <path d="M7 8v11h10V8M9 8V5h6v3M5 8h14M10 11v5M14 11v5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Shell({ children, active, theme, clientMode = false, trashCount = 0, onNavigate, onToggleTheme }: Props) {
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
              <button
                className={active === '/account' ? 'nav-link active' : 'nav-link'}
                onClick={() => onNavigate('/account')}
              >
                Account
              </button>
              <button
                className={active === '/trash' ? 'nav-link active nav-link-icon' : 'nav-link nav-link-icon'}
                onClick={() => onNavigate('/trash')}
                aria-label={`Trash${trashCount ? `, ${trashCount} ${trashCount === 1 ? 'project' : 'projects'}` : ''}`}
                title="Trash"
              >
                <TrashIcon />
                {trashCount > 0 && <span className="nav-count">{trashCount}</span>}
              </button>
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
