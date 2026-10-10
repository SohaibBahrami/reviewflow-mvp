import test from 'node:test'
import assert from 'node:assert/strict'
import {
  cloudRowToProject,
  normalizeProjectForCloud,
  projectToCloudPayload,
} from '../src/lib/cloudProjectCore.js'

const uuid = (number) => `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`

function makeProject(overrides = {}) {
  return {
    id: uuid(1),
    title: 'Launch video',
    client: 'Northstar Coffee',
    status: 'approved',
    version: 2,
    createdAt: '2026-10-01T10:00:00.000Z',
    shareToken: uuid(2),
    localVideoId: 'local-v2',
    localVideoName: 'cut-v2.mp4',
    localVideoUrl: 'blob:current',
    comments: [{ id: uuid(3), timestamp: 14.125, text: 'Shorten intro', author: 'Maya', createdAt: '2026-10-01T10:10:00.000Z', status: 'open' }],
    versionHistory: [{
      version: 1,
      status: 'completed',
      archivedAt: '2026-09-01T10:00:00.000Z',
      localVideoId: 'local-v1',
      localVideoName: 'cut-v1.mp4',
      comments: [{ id: uuid(4), timestamp: 8, text: 'Old note', author: 'Maya', createdAt: '2026-09-01T10:10:00.000Z', status: 'resolved' }],
    }],
    ...overrides,
  }
}

test('cloud identity normalization replaces legacy ids and preserves valid ids', () => {
  let next = 10
  const normalized = normalizeProjectForCloud(makeProject({
    id: 'demo-project',
    shareToken: 'legacy-token',
    comments: [{ id: 'comment-1', timestamp: 0, text: 'Hi', author: 'You', createdAt: 'now', status: 'open' }],
  }), () => uuid(next++))

  assert.equal(normalized.id, uuid(10))
  assert.equal(normalized.shareToken, uuid(11))
  assert.equal(normalized.comments[0].id, uuid(12))
  assert.equal(normalized.versionHistory[0].comments[0].id, uuid(4))
})

test('cloud payload serializes all versions and never sends browser-local video identifiers or blob URLs', () => {
  const payload = projectToCloudPayload(makeProject())
  assert.equal(payload.id, uuid(1))
  assert.equal(payload.current_version, 2)
  assert.deepEqual(payload.versions.map((version) => version.version_number), [1, 2])
  assert.equal(payload.versions[0].status, 'completed')
  assert.equal(payload.versions[0].comments[0].timestamp_seconds, 8)
  assert.equal(payload.versions[1].comments[0].body, 'Shorten intro')
  assert.ok(!JSON.stringify(payload).includes('local-v1'))
  assert.ok(!JSON.stringify(payload).includes('local-v2'))
  assert.ok(!JSON.stringify(payload).includes('blob:current'))
})

test('cloud restore keeps local video blobs only when the exact version matches', () => {
  const local = makeProject()
  const restored = cloudRowToProject({
    id: uuid(1),
    title: 'Cloud title',
    client_name: 'Cloud client',
    status: 'in_review',
    current_version: 2,
    share_token: uuid(2),
    created_at: local.createdAt,
    project_versions: [
      { version_number: 1, status: 'completed', created_at: '2026-09-01T10:00:00.000Z', video_provider: null, video_asset_id: null,
        review_comments: [{ id: uuid(4), timestamp_seconds: 8, body: 'Old note', author_name: 'Maya', created_at: '2026-09-01T10:10:00.000Z', status: 'resolved' }] },
      { version_number: 2, status: 'approved', created_at: local.createdAt, video_provider: null, video_asset_id: null,
        review_comments: [{ id: uuid(3), timestamp_seconds: 14.125, body: 'Shorten intro', author_name: 'Maya', created_at: '2026-10-01T10:10:00.000Z', status: 'open' }] },
    ],
  }, local)

  assert.equal(restored.title, 'Cloud title')
  assert.equal(restored.localVideoId, 'local-v2')
  assert.equal(restored.localVideoUrl, 'blob:current')
  assert.equal(restored.versionHistory[0].localVideoId, 'local-v1')
  assert.equal(restored.versionHistory[0].comments[0].text, 'Old note')
  assert.equal(restored.comments[0].timestamp, 14.125)
})

test('a remote-only version never inherits a video from a different local version', () => {
  const local = makeProject({ version: 1, localVideoId: 'local-v1', localVideoName: 'cut-v1.mp4' })
  const restored = cloudRowToProject({
    id: uuid(1),
    title: 'Launch video',
    client_name: 'Northstar',
    status: 'in_review',
    current_version: 2,
    share_token: uuid(2),
    created_at: local.createdAt,
    project_versions: [{ version_number: 2, status: 'in_review', created_at: local.createdAt, review_comments: [] }],
  }, local)

  assert.equal(restored.localVideoId, undefined)
  assert.equal(restored.localVideoUrl, undefined)
  assert.equal(restored.versionHistory[0]?.localVideoId, undefined)
})


test('trashed projects retain their trash state but preserve a valid review state for the current version', () => {
  const payload = projectToCloudPayload(makeProject({
    status: 'trashed',
    statusBeforeTrash: 'approved',
    trashedAt: '2026-10-10T12:00:00.000Z',
  }))
  assert.equal(payload.status, 'trashed')
  assert.equal(payload.status_before_trash, 'approved')
  assert.equal(payload.versions.at(-1).status, 'approved')
})

test('cloud database sync stays owner-scoped and does not expose the service role to the browser', () => {
  const fs = require('node:fs')
  const migration = fs.readFileSync(new URL('../supabase/migrations/20261010000000_cloud_project_sync.sql', import.meta.url), 'utf8')
  const schema = fs.readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8')
  const appSources = [
    fs.readFileSync(new URL('../src/lib/supabase.ts', import.meta.url), 'utf8'),
    fs.readFileSync(new URL('../src/lib/cloudProjectStore.ts', import.meta.url), 'utf8'),
  ].join('\n')

  assert.match(migration, /security invoker/i)
  assert.match(migration, /auth\.uid\(\)/)
  assert.match(migration, /where public\.projects\.owner_id = v_owner_id/i)
  assert.match(migration, /grant execute on function public\.sync_reviewflow_project\(jsonb\) to authenticated/i)
  assert.match(schema, /alter table public\.projects enable row level security/i)
  assert.doesNotMatch(migration, /grant execute on function public\.sync_reviewflow_project\(jsonb\) to anon/i)
  assert.doesNotMatch(appSources, /service[_-]?role/i)
})
