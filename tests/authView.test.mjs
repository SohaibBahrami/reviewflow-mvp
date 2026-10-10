import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { messages } from '../src/lib/i18nCore.js'

test('account sign-up includes display name, password confirmation, and show/hide controls', () => {
  const source = readFileSync(new URL('../src/components/AuthView.tsx', import.meta.url), 'utf8')
  assert.match(source, /options:\s*\{\s*data:\s*\{\s*display_name:\s*creatorName\.trim\(\)/)
  assert.match(source, /password !== confirmPassword/)
  assert.match(source, /type=\{showPassword \? 'text' : 'password'\}/)
  assert.match(source, /auth\.updateUser\(\{\s*data:\s*\{\s*display_name:\s*cleanName/)
})

test('new account controls have translations in every supported locale', () => {
  for (const locale of ['en', 'fr', 'es', 'de', 'pt']) {
    for (const key of ['Confirm password', 'Creator name', 'Hide password', 'Name is required.', 'Passwords do not match.', 'Profile saved.', 'Save profile', 'Show password', 'We could not save your profile. Check your connection and try again.']) {
      assert.ok(messages[locale][key], locale + ' is missing ' + key)
    }
  }
})
