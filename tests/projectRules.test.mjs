import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import {
  MAX_TRASH_PROJECTS,
  canMoveProjectToTrash,
  countTrashedProjects,
  getDashboardProjectGroups,
  getProjectValidationError,
} from '../src/lib/projectRulesCore.js'

const project = (id, status = 'in_review') => ({ id, status })

test('empty or whitespace-only project details are rejected', () => {
  assert.match(getProjectValidationError('', '', false), /project name and client name/i)
  assert.match(getProjectValidationError('   ', 'Client', true), /project name/i)
  assert.match(getProjectValidationError('Project', '   ', true), /client name/i)
  assert.equal(getProjectValidationError('  Launch video  ', '  Client  ', true), null)
})

test('project creation requires a video even when the text fields are valid', () => {
  assert.match(getProjectValidationError('Launch video', 'Northstar Coffee', false), /select a video file/i)
  assert.equal(getProjectValidationError('Launch video', 'Northstar Coffee', true), null)
})

test('form UIs require a video and block empty editor feedback', () => {
  const newProject = readFileSync(new URL('../src/components/NewProject.tsx', import.meta.url), 'utf8')
  const videoReview = readFileSync(new URL('../src/components/VideoReview.tsx', import.meta.url), 'utf8')
  assert.ok(newProject.includes('type=\"file\" accept=\"video/*\" required'))
  assert.ok(newProject.includes('noValidate onSubmit={submit}'))
  assert.ok(videoReview.includes('disabled={!commentText.trim()}'))
})

test('Trash counts only trashed projects', () => {
  assert.equal(countTrashedProjects([
    project('active'), project('completed', 'completed'),
    project('trash-1', 'trashed'), project('trash-2', 'trashed'),
  ]), 2)
})

test('projects may be moved to Trash until exactly three entries are present', () => {
  const twoTrashed = [project('a'), project('t1', 'trashed'), project('t2', 'trashed')]
  assert.equal(MAX_TRASH_PROJECTS, 3)
  assert.equal(canMoveProjectToTrash(twoTrashed, 'a'), true)

  const fullTrash = [...twoTrashed, project('t3', 'trashed')]
  assert.equal(canMoveProjectToTrash(fullTrash, 'a'), false)
  assert.equal(canMoveProjectToTrash(fullTrash, 't1'), false)
  assert.equal(canMoveProjectToTrash(fullTrash, 'missing'), false)
})

test('trashed projects disappear from active work and completed projects stay archived', () => {
  const projects = [
    project('active', 'in_review'),
    project('done', 'completed'),
    project('deleted', 'trashed'),
  ]
  const groups = getDashboardProjectGroups(projects)
  assert.deepEqual(groups.active.map((item) => item.id), ['active'])
  assert.deepEqual(groups.completed.map((item) => item.id), ['done'])
})
