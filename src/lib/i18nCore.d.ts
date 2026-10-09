export type Locale = 'en' | 'fr' | 'es' | 'de' | 'pt'
export declare const LOCALE_OPTIONS: ReadonlyArray<{ code: Locale; label: string; nativeLabel: string }>
export declare const COOKIE_NAMES: Readonly<{ locale: 'reviewflow_locale'; notice: 'reviewflow_cookie_notice' }>
export declare const messages: Readonly<Record<Locale, Readonly<Record<string, string>>>>
export declare const REQUIRED_TRANSLATION_KEYS: readonly string[]
export declare function normalizeLocale(value: unknown): Locale | null
export declare function getCookieValue(cookieString: string, name: string): string | null
export declare function getLocaleFromPreferences(cookieString: string, preferredLanguages?: readonly string[]): Locale
export declare function buildPreferenceCookie(name: string, value: string, secure?: boolean): string
export declare function hasSeenCookieNotice(cookieString: string): boolean
export declare function translate(locale: string, key: string, values?: Record<string, string | number>): string
export declare function getTranslationStats(): Record<Locale, number>
