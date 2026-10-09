import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Theme } from '../lib/theme'
import { buildPreferenceCookie, COOKIE_NAMES, hasSeenCookieNotice } from '../lib/i18nCore.js'
import { useI18n } from '../lib/i18n'
import { LanguageFlag } from './LanguageFlag'
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
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon"><path d="M7 8v11h10V8M9 8V5h6v3M5 8h14M10 11v5M14 11v5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function saveNoticeCookie() {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:'
  document.cookie = buildPreferenceCookie(COOKIE_NAMES.notice, 'seen', secure)
}

export function Shell({ children, active, theme, clientMode = false, trashCount = 0, onNavigate, onToggleTheme }: Props) {
  const { t, locale, setLocale, localeOptions } = useI18n()
  const selectedLanguage = localeOptions.find((option) => option.code === locale) ?? localeOptions[0]
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)
  const languagePickerRef = useRef<HTMLDivElement>(null)
  const languageTriggerRef = useRef<HTMLButtonElement>(null)
  const [showCookieNotice, setShowCookieNotice] = useState(() => !hasSeenCookieNotice(document.cookie))
  const [showCookieSettings, setShowCookieSettings] = useState(false)
  const links = [['/', 'Projects'], ['/new', 'Create project']] as const

  useEffect(() => {
    if (!isLanguageMenuOpen) return

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!languagePickerRef.current?.contains(event.target as Node)) setIsLanguageMenuOpen(false)
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsLanguageMenuOpen(false)
        languageTriggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)
    languagePickerRef.current?.querySelector<HTMLButtonElement>('[role="menuitemradio"][aria-checked="true"]')?.focus()
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isLanguageMenuOpen])

  function chooseLanguage(nextLocale: typeof locale) {
    setLocale(nextLocale)
    setIsLanguageMenuOpen(false)
    languageTriggerRef.current?.focus()
  }

  function dismissCookieNotice() {
    saveNoticeCookie()
    setShowCookieNotice(false)
  }

  return (
    <div className={clientMode ? 'app-shell client-shell' : 'app-shell'}>
      <header className="topbar">
        <div className="topbar-inner">
          <Logo onNavigate={() => onNavigate('/')} />
          {clientMode ? (
            <div className="client-mode-label"><span className="client-mode-dot" aria-hidden="true" />{t('Client preview')}</div>
          ) : (
            <nav className="main-nav" aria-label={t('Primary navigation')}>
              {links.map(([href, label]) => <button key={href} className={active === href ? 'nav-link active' : 'nav-link'} onClick={() => onNavigate(href)}>{t(label)}</button>)}
              <button className={active === '/account' ? 'nav-link active' : 'nav-link'} onClick={() => onNavigate('/account')}>{t('Account')}</button>
              <button className={active === '/trash' ? 'nav-link active nav-link-icon' : 'nav-link nav-link-icon'} onClick={() => onNavigate('/trash')} aria-label={`${t('Trash')}${trashCount ? `, ${trashCount}` : ''}`} title={t('Trash')}>
                <TrashIcon />{trashCount > 0 && <span className="nav-count">{trashCount}</span>}
              </button>
            </nav>
          )}
          <div className="topbar-actions">
            {!clientMode && <span className="topbar-badge">{t('Local prototype')}</span>}
            <div className="language-picker" ref={languagePickerRef}>
              <button
                ref={languageTriggerRef}
                className="language-picker-trigger"
                type="button"
                title={`${t('Language')}: ${selectedLanguage.nativeLabel}`}
                aria-label={`${t('Language')}: ${selectedLanguage.nativeLabel}`}
                aria-haspopup="menu"
                aria-expanded={isLanguageMenuOpen}
                onClick={() => setIsLanguageMenuOpen((open) => !open)}
              >
                <LanguageFlag locale={locale} />
                <span className="language-picker-code">{locale.toUpperCase()}</span>
                <svg className="language-picker-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              {isLanguageMenuOpen && (
                <div className="language-menu" role="menu" aria-label={t('Language')}>
                  {localeOptions.map((option) => (
                    <button
                      key={option.code}
                      className="language-menu-item"
                      type="button"
                      role="menuitemradio"
                      aria-checked={locale === option.code}
                      onClick={() => chooseLanguage(option.code)}
                    >
                      <LanguageFlag locale={option.code} />
                      <span>{option.nativeLabel}</span>
                      <span className="language-menu-code">{option.code.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {!clientMode && <button className="cookie-settings-trigger" type="button" onClick={() => setShowCookieSettings(true)}>{t('Cookie settings')}</button>}
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
        </div>
      </header>
      <main className="page-wrap">{children}</main>

      {showCookieNotice && !clientMode && (
        <aside className="cookie-banner" role="region" aria-label={t('Cookie notice')}>
          <div><strong>{t('Cookie notice')}</strong><p>{t('We use first-party functional cookies to remember your language and this notice. ReviewFlow does not use analytics or advertising cookies.')}</p></div>
          <div className="cookie-banner-actions">
            <button className="button button-secondary" type="button" onClick={() => setShowCookieSettings(true)}>{t('Cookie details')}</button>
            <button className="button button-primary" type="button" onClick={dismissCookieNotice}>{t('Got it')}</button>
          </div>
        </aside>
      )}

      {showCookieSettings && !clientMode && (
        <div className="cookie-backdrop" role="presentation" onMouseDown={() => setShowCookieSettings(false)}>
          <section className="cookie-settings-panel" role="dialog" aria-modal="true" aria-labelledby="cookie-settings-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="cookie-settings-heading"><div><p className="eyebrow">{t('Cookie information')}</p><h2 id="cookie-settings-title">{t('Cookie settings')}</h2></div><button className="icon-button" aria-label={t('Close')} onClick={() => setShowCookieSettings(false)}>×</button></div>
            <p>{t('We use first-party functional cookies to remember your language and this notice. ReviewFlow does not use analytics or advertising cookies.')}</p>
            <div className="cookie-category"><div><strong>{t('Only functional cookies')}</strong><p>{t('Remember language')}</p></div><span className="pill success">{t('Required')}</span></div>
            <p className="muted cookie-settings-note">{t('No optional cookies are enabled in this version.')}</p>
            <div className="cookie-settings-actions"><button className="button button-primary" type="button" onClick={() => { dismissCookieNotice(); setShowCookieSettings(false) }}>{t('Save settings')}</button></div>
          </section>
        </div>
      )}
    </div>
  )
}
