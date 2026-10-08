import type { ReactNode } from 'react'
import { Logo } from './Logo'

type Props = { children: ReactNode; active: string; onNavigate: (path: string) => void }

export function Shell({ children, active, onNavigate }: Props) {
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
          <div className="topbar-badge">Prototype mode</div>
        </div>
      </header>
      <main className="page-wrap">{children}</main>
    </div>
  )
}
