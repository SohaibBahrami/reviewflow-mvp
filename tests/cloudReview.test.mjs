import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('cloud upload keeps Cloudflare credentials server-side and marks videos private', () => {
  const upload = readFileSync(new URL('../supabase/functions/stream-upload/index.ts', import.meta.url), 'utf8')
  const client = readFileSync(new URL('../src/lib/cloudVideoUpload.ts', import.meta.url), 'utf8')
  assert.match(upload, /SUPABASE_SERVICE_ROLE_KEY/)
  assert.match(upload, /CLOUDFLARE_API_TOKEN/)
  assert.match(upload, /requiresignedurls/)
  assert.match(upload, /Upload-Length/)
  assert.match(upload, /Upload-Metadata/)
  assert.match(upload, /getUser\(match\[1\]\)/)
  assert.match(upload, /\.eq\('owner_id', user\.id\)/)
  assert.doesNotMatch(client, /CLOUDFLARE_API_TOKEN|SUPABASE_SERVICE_ROLE_KEY/)
  assert.match(client, /method: 'PATCH'/)
})

test('public client review uses the share token and handles client actions', () => {
  const share = readFileSync(new URL('../supabase/functions/share-review/index.ts', import.meta.url), 'utf8')
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
  const review = readFileSync(new URL('../src/components/RemoteClientReview.tsx', import.meta.url), 'utf8')
  assert.match(share, /\.eq\('share_token', shareToken\)/)
  assert.match(share, /action === 'comment'/)
  assert.match(share, /action === 'approve'/)
  assert.match(share, /\/token'/)
  assert.match(app, /RemoteClientReview shareToken/)
  assert.match(review, /functions\.invoke\('share-review'/)
})
