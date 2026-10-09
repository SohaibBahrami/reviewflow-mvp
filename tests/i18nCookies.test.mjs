import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  buildPreferenceCookie,
  COOKIE_NAMES,
  getCookieValue,
  getLocaleFromPreferences,
  getTranslationStats,
  hasSeenCookieNotice,
  LOCALE_OPTIONS,
  messages,
  normalizeLocale,
  REQUIRED_TRANSLATION_KEYS,
  translate,
} from '../src/lib/i18nCore.js'

const root = path.resolve('src')
function collectTypeScriptFiles(directory) {
  const files = []
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...collectTypeScriptFiles(fullPath))
    else if (/\.(?:tsx|ts)$/.test(entry.name)) files.push(fullPath)
  }
  return files
}

test('supports English, French, Spanish, Greek, and Portuguese using standard locale codes', () => {
  assert.deepEqual(LOCALE_OPTIONS.map(({ code }) => code), ['en', 'fr', 'es', 'el', 'pt'])
  assert.equal(normalizeLocale('fr-FR'), 'fr')
  assert.equal(normalizeLocale('es_ES'), 'es')
  assert.equal(normalizeLocale('el-GR'), 'el')
  assert.equal(normalizeLocale('pt-BR'), 'pt')
  assert.equal(normalizeLocale('de-DE'), null)
})

test('saved language cookie takes precedence over browser language', () => {
  assert.equal(getLocaleFromPreferences('reviewflow_locale=fr', ['es-ES', 'en-US']), 'fr')
  assert.equal(getLocaleFromPreferences('', ['el-GR', 'en-US']), 'el')
  assert.equal(getLocaleFromPreferences('reviewflow_locale=unsupported', ['pt-BR']), 'pt')
  assert.equal(getLocaleFromPreferences('', ['de-DE']), 'en')
})

test('cookie parsing is robust to spaces, multiple cookies, and malformed encoding', () => {
  assert.equal(getCookieValue('other=value; reviewflow_locale=pt; reviewflow_cookie_notice=seen', 'reviewflow_locale'), 'pt')
  assert.equal(getCookieValue('reviewflow_locale=%E0%A4%A', 'reviewflow_locale'), null)
  assert.equal(getCookieValue('', 'reviewflow_locale'), null)
})

test('functional preference cookies use safe attributes and allowlisted values', () => {
  assert.equal(
    buildPreferenceCookie(COOKIE_NAMES.locale, 'fr', true),
    'reviewflow_locale=fr; Path=/; Max-Age=31536000; SameSite=Lax; Secure',
  )
  assert.equal(buildPreferenceCookie(COOKIE_NAMES.notice, 'seen', false), 'reviewflow_cookie_notice=seen; Path=/; Max-Age=31536000; SameSite=Lax')
  assert.throws(() => buildPreferenceCookie('reviewflow_user_email', 'person@example.com'), /Unsupported preference cookie/)
  assert.throws(() => buildPreferenceCookie(COOKIE_NAMES.locale, 'fr; Secure', true), /Unsupported language preference/)
  assert.throws(() => buildPreferenceCookie(COOKIE_NAMES.notice, 'anything', true), /Unsupported cookie notice preference/)
})

test('cookie notice preference reads only the first-party notice cookie', () => {
  assert.equal(hasSeenCookieNotice('reviewflow_cookie_notice=seen'), true)
  assert.equal(hasSeenCookieNotice('reviewflow_cookie_notice=no'), false)
  assert.equal(hasSeenCookieNotice(''), false)
})

test('all UI translations exist and are non-empty in every supported language', () => {
  const uniqueKeys = new Set(REQUIRED_TRANSLATION_KEYS)
  assert.equal(uniqueKeys.size, REQUIRED_TRANSLATION_KEYS.length, 'translation keys should not be duplicated')
  for (const { code } of LOCALE_OPTIONS) {
    assert.equal(Object.keys(messages[code]).length, REQUIRED_TRANSLATION_KEYS.length, `${code} dictionary size`)
    for (const key of REQUIRED_TRANSLATION_KEYS) {
      assert.equal(typeof messages[code][key], 'string', `${code} translation for ${key}`)
      assert.ok(messages[code][key].trim(), `${code} translation should not be empty: ${key}`)
    }
  }
  assert.deepEqual(Object.values(getTranslationStats()), LOCALE_OPTIONS.map(() => REQUIRED_TRANSLATION_KEYS.length))
})

test('every literal translation key used by TS/TSX source exists in the dictionary', () => {
  const usedKeys = new Set()
  const literalTranslationCall = /\bt\((['"])(.*?)\1/gms
  for (const file of collectTypeScriptFiles(root)) {
    const source = fs.readFileSync(file, 'utf8')
    let match
    while ((match = literalTranslationCall.exec(source)) !== null) {
      if (!match[2].includes('\n')) usedKeys.add(match[2])
    }
  }
  for (const key of usedKeys) assert.ok(key in messages.en, `missing English source key: ${key}`)
  assert.ok('Enter a project name and client name before creating the project.' in messages.fr)
})

test('translation interpolation preserves user-supplied values and removes known placeholders', () => {
  assert.equal(translate('fr', 'Client: {client}', { client: 'Café du Centre' }), 'Client : Café du Centre')
  assert.equal(translate('es', 'Version {version}', { version: 3 }), 'Versión 3')
  assert.equal(translate('pt', 'Trash is full ({count}/{max}). Restore a project or permanently delete one in Trash before deleting another.', { count: 3, max: 3 }), 'O lixo está cheio (3/3). Restaure um projeto ou elimine um definitivamente antes de eliminar outro.')
})
