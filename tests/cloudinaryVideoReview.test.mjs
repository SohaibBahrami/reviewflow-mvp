import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8')

test('Cloudinary review upload is owner-scoped, authenticated, and signed server-side', () => {
  const edge = read('supabase/functions/cloudinary-upload/index.ts')
  const browser = read('src/lib/cloudinaryVideoUpload.ts')

  assert.match(edge, /admin\.auth\.getUser/)
  assert.match(edge, /\.eq\('owner_id', user\.id\)/)
  assert.match(edge, /CLOUDINARY_API_SECRET/)
  assert.match(edge, /crypto\.subtle\.digest\('SHA-1'/)
  assert.match(edge, /type: 'authenticated'/)
  assert.match(edge, /reserve_cloudinary_video_upload/)
  assert.doesNotMatch(browser, /CLOUDINARY_API_SECRET/)
  assert.doesNotMatch(browser, /SUPABASE_SERVICE_ROLE_KEY/)
})

test('Cloudinary uploads use only the watermarked review copy and enforce conservative free-plan caps', () => {
  const edge = read('supabase/functions/cloudinary-upload/index.ts')
  const migration = read('supabase/migrations/20261011000000_cloudinary_free_video_quota.sql')
  const docs = read('docs/SUPABASE_SETUP.md')

  assert.match(edge, /MAX_FILE_BYTES = 250 \* 1024 \* 1024/)
  assert.match(edge, /MAX_VIDEO_SECONDS = 10 \* 60/)
  assert.match(edge, /c_limit,w_1280,h_720/)
  assert.match(edge, /REVIEW%20COPY/)
  assert.match(edge, /sp_hd\/f_m3u8/)
  assert.match(migration, /1073741824/)
  assert.match(migration, /1800/)
  assert.match(migration, /2147483648/)
  assert.match(migration, /grant execute on function public\.reserve_cloudinary_video_upload[\s\S]+to service_role/i)
  assert.match(docs, /do not add payment details or upgrade/i)
})

test('client reviews use Cloudinary HLS timestamps and display a moving review watermark', () => {
  const share = read('supabase/functions/share-review/index.ts')
  const remote = read('src/components/RemoteClientReview.tsx')
  const review = read('src/components/ClientReview.tsx')
  const player = read('src/components/CloudinaryVideoPlayer.tsx')
  const styles = read('src/styles.css')

  assert.match(share, /currentVersion\.video_provider === 'cloudinary'/)
  assert.match(share, /\/video\/authenticated\/s--/)
  assert.match(remote, /playbackProvider/)
  assert.match(review, /CloudinaryVideoPlayer/)
  assert.match(player, /currentTime\(\)/)
  assert.match(player, /player\.on\('timeupdate'/)
  assert.match(player, /REVIEW COPY/)
  assert.match(styles, /@keyframes review-copy-watermark-move/)
})

test('permanently deleting a project also deletes its Cloudinary review copies', () => {
  const app = read('src/App.tsx')
  const edge = read('supabase/functions/cloudinary-upload/index.ts')
  assert.match(app, /action: 'delete-project'/)
  assert.match(app, /cloudVideoProvider === 'cloudinary'/)
  assert.match(edge, /if \(action === 'delete-project'\)/)
  assert.match(edge, /deleteCloudinaryResources/)
})


test('Cloudinary player owns an isolated imperative mount so dispose cannot break React child removal', () => {
  const player = read('src/components/CloudinaryVideoPlayer.tsx')
  assert.match(player, /const mountRef = useRef<HTMLDivElement \\| null>\\(null\\)/)
  assert.match(player, /mount\\.replaceChildren\\(video\\)/)
  assert.match(player, /mountRef\\.current\\?\\.replaceChildren\\(\\)/)
  assert.match(player, /player\\.dispose\\(\\)/)
  assert.doesNotMatch(player, /<video\\s*id=\\{playerId\\}/, 'React must not own the element Cloudinary removes')
})
