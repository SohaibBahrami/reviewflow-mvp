import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const authView = fs.readFileSync(new URL('../src/components/AuthView.tsx', import.meta.url), 'utf8')

test('saved creator name is displayed until the user chooses to edit it', () => {
  assert.match(authView, /displayName && !editingName && <p className="muted">\{displayName\}<\/p>/)
  assert.match(authView, /\{\(!displayName \|\| editingName\) && \(/)
  assert.match(authView, /setEditingName\(false\)/)
  assert.match(authView, /t\('Change name'\)/)
})

test('password editing is opt-in and updates the signed-in Supabase user', () => {
  assert.match(authView, /!changingPassword && \(/)
  assert.match(authView, /\{changingPassword && \(/)
  assert.match(authView, /t\('Change password'\)/)
  assert.match(authView, /client\.auth\.updateUser\(\{ password: newPassword \}\)/)
  assert.match(authView, /t\('Your password has been changed\.'\)/)
})

test('every input in account and auth forms has an id and name', () => {
  const inputs = authView.match(/<input\b[\s\S]*?\/>/g) ?? []
  assert.equal(inputs.length, 7, 'expected account, sign-in, and sign-up fields')
  for (const input of inputs) {
    assert.match(input, /\sid=/, `input is missing id: ${input}`)
    assert.match(input, /\sname=/, `input is missing name: ${input}`)
  }
})
