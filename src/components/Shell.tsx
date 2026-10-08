import type { ReactNode } from 'react'
import type { Theme } from '../lib/theme'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'

type Props = {
  children: ReactNode
  active: string
  theme: Theme
  onNavigate: (path: string) => void
  onToggleTheme: () => void
}

export function Shell({ children, active, theme, onNavigate, onToggleTheme }: Props) {
  const links = [
    ['/', 'Dashboard'],
    ['/new', 'New project'],
  ] as const

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Logo />
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
          <div className="topbar-actions"><div className="topbar-badge">Prototype mode</div><ThemeToggle theme={theme} onToggle={onToggleTheme} /></div>
        </div>
      </header>
      <main className="page-wrap">{children}</main>
    </div>
  )
}
