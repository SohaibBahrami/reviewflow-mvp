import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { messages } from '../src/lib/i18nCore.js'

test('account form supports creator name, password confirmation, and independent show/hide controls', () => {
  const source = readFileSync(new URL('../src/components/AuthView.tsx', import.meta.url), 'utf8')
  assert.match(source, /display_name:\s*name\.trim\(\)/)
  assert.match(source, /password !== confirmPassword/)
  assert.match(source, /type=\{showPassword \? 'text' : 'password'\}/)
  assert.match(source, /type=\{showConfirmPassword \? 'text' : 'password'\}/)
  assert.match(source, /auth\.updateUser\(\{\s*data:\s*\{\s*display_name:\s*name\.trim\(\)/)
})

test('account and profile messages have translations in every supported locale', () => {
  const keys = [
    'Confirm password', 'Your name', 'Enter your name',
    'Enter your name to create an account.', 'Passwords do not match.',
    'Enter your name to save your profile.',
    'We could not save your name. Check your connection and try again.',
    'Your name has been saved.', 'Creator profile',
    'This is the name associated with your creator account.',
    'Re-enter your password', 'Saving…', 'Save name',
    'Show', 'Hide', 'Show password', 'Hide password',
  ]
  for (const locale of ['en', 'fr', 'es', 'de', 'pt']) {
    for (const key of keys) assert.ok(messages[locale][key], locale + ' is missing ' + key)
  }
})
