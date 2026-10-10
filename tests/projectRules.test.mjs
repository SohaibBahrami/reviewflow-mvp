import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import {
  MAX_TRASH_PROJECTS,
  canMoveProjectToTrash,
  countTrashedProjects,
  getDashboardProjectGroups,
  getProjectValidationError,
  getProjectVideoIds,
  startNextVersion,
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


test('starting a version remains compatible with older projects without a history field', () => {
  const oldProject = {
    id: 'legacy-project',
    version: 1,
    status: 'in_review',
    comments: [{ id: 'legacy-comment', timestamp: 8, text: 'Keep this note', status: 'open' }],
  }
  const next = startNextVersion(oldProject, { localVideoId: 'video-v2', localVideoName: 'cut-v2.mp4' }, '2026-10-09T12:00:00.000Z')
  assert.deepEqual(next.versionHistory.map((version) => version.version), [1])
  assert.equal(next.versionHistory[0].comments[0].id, 'legacy-comment')
  assert.deepEqual(next.comments, [])
})

test('starting a new version archives prior feedback and keeps it separate from current feedback', () => {
  const original = {
    id: 'project-1',
    version: 2,
    status: 'approved',
    completedAt: '2026-10-01T10:00:00.000Z',
    localVideoId: 'video-v2',
    localVideoName: 'cut-v2.mp4',
    localVideoUrl: 'blob:old-version',
    comments: [
      { id: 'c1', timestamp: 12, text: 'Shorten the intro', status: 'resolved' },
      { id: 'c2', timestamp: 45, text: 'Lower music', status: 'open' },
    ],
    versionHistory: [{ version: 1, status: 'completed', archivedAt: '2026-09-01T10:00:00.000Z', comments: [] }],
  }
  const next = startNextVersion(original, { localVideoId: 'video-v3', localVideoName: 'cut-v3.mp4' }, '2026-10-09T12:00:00.000Z')

  assert.equal(next.version, 3)
  assert.equal(next.status, 'in_review')
  assert.equal(next.completedAt, undefined)
  assert.deepEqual(next.comments, [])
  assert.equal(next.versionHistory.length, 2)
  assert.equal(next.versionHistory[0].version, 1)
  assert.equal(next.versionHistory[1].version, 2)
  assert.equal(next.versionHistory[1].status, 'approved')
  assert.equal(next.versionHistory[1].archivedAt, '2026-10-09T12:00:00.000Z')
  assert.equal(next.versionHistory[1].localVideoId, 'video-v2')
  assert.equal(next.versionHistory[1].localVideoName, 'cut-v2.mp4')
  assert.equal(next.localVideoId, 'video-v3')
  assert.equal(next.localVideoName, 'cut-v3.mp4')
  assert.equal(next.localVideoUrl, undefined, 'the previous temporary URL must not be reused for the new video')
  assert.deepEqual(next.versionHistory[1].comments, original.comments)

  next.comments.push({ id: 'c3', timestamp: 1, text: 'New version feedback' })
  assert.equal(next.versionHistory[1].comments.length, 2, 'new feedback must not leak into the archived version')
  assert.equal(original.version, 2, 'starting the next version must not mutate the source object')
})


test('project video cleanup includes current and historical files exactly once', () => {
  assert.deepEqual(getProjectVideoIds({
    localVideoId: 'video-v3',
    versionHistory: [
      { version: 1, localVideoId: 'video-v1' },
      { version: 2, localVideoId: 'video-v2' },
      { version: 3, localVideoId: 'video-v1' },
      { version: 4 },
    ],
  }), ['video-v3', 'video-v1', 'video-v2'])
})

test('new-version UI requires a replacement file and supports previewing archived video', () => {
  const videoReview = readFileSync(new URL('../src/components/VideoReview.tsx', import.meta.url), 'utf8')
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
  assert.match(videoReview, /saveLocalVideo\(/)
  assert.match(videoReview, /startNextVersion\(project,\s*\{\s*localVideoId:/)
  assert.match(videoReview, /getLocalVideo\(/)
  assert.match(videoReview, /Return to current version/)
  assert.match(app, /deleteLocalVideos\(getProjectVideoIds\(target\)\)/)
})
