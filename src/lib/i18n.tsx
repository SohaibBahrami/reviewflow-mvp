import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  buildPreferenceCookie,
  COOKIE_NAMES,
  getLocaleFromPreferences,
  LOCALE_OPTIONS,
  translate,
  type Locale,
} from './i18nCore.js'

type I18nValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, values?: Record<string, string | number>) => string
  localeOptions: typeof LOCALE_OPTIONS
}

const I18nContext = createContext<I18nValue | null>(null)

function initialLocale(): Locale {
  if (typeof document === 'undefined') return 'en'
  const languages = typeof navigator === 'undefined' ? [] : [...(navigator.languages ?? []), navigator.language]
  return getLocaleFromPreferences(document.cookie, languages)
}

function saveCookie(name: string, value: string) {
  if (typeof document === 'undefined') return
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:'
  document.cookie = buildPreferenceCookie(name, value, secure)
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  const setLocale = useCallback((nextLocale: Locale) => {
    if (!LOCALE_OPTIONS.some((option) => option.code === nextLocale)) return
    saveCookie(COOKIE_NAMES.locale, nextLocale)
    setLocaleState(nextLocale)
  }, [])

  const t = useCallback((key: string, values: Record<string, string | number> = {}) => (
    translate(locale, key, values)
  ), [locale])

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = translate(locale, 'ReviewFlow — Client approvals without the mess')
  }, [locale])

  const value = useMemo<I18nValue>(() => ({ locale, setLocale, t, localeOptions: LOCALE_OPTIONS }), [locale, setLocale, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used inside I18nProvider')
  return value
}

export type { Locale }
