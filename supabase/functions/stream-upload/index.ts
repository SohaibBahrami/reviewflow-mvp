import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}
const MAX_FILE_BYTES = 10 * 1024 * 1024 * 1024
const MAX_VIDEO_SECONDS = 4 * 60 * 60

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}
function base64(value: string) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary)
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return reply({ error: 'Method not allowed.' }, 405)

  try {
    const url = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')
    const cloudflareToken = Deno.env.get('CLOUDFLARE_API_TOKEN')
    if (!url || !serviceKey || !accountId || !cloudflareToken) {
      return reply({ error: 'Cloud video upload is not configured.' }, 503)
    }

    const authorization = request.headers.get('Authorization') || ''
    const match = authorization.match(/^Bearer\s+(.+)$/i)
    if (!match) return reply({ error: 'Sign in before uploading a video.' }, 401)

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: authData, error: authError } = await admin.auth.getUser(match[1])
    const user = authData.user
    if (authError || !user) return reply({ error: 'Your session is invalid. Sign in again.' }, 401)

    const body = await request.json()
    const action = body?.action
    const projectId = typeof body?.projectId === 'string' ? body.projectId : ''
    const versionNumber = Number(body?.versionNumber)
    if (!projectId || !Number.isInteger(versionNumber) || versionNumber < 1) {
      return reply({ error: 'A valid project and version are required.' }, 400)
    }

    const { data: project, error: projectError } = await admin
      .from('projects')
      .select('id, owner_id, status, current_version')
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .maybeSingle()
    if (projectError) return reply({ error: 'Could not verify project ownership.' }, 500)
    if (!project || project.status === 'trashed') return reply({ error: 'Project not found.' }, 404)

    if (action === 'create') {
      if (project.current_version !== versionNumber) {
        return reply({ error: 'Upload a video for the current version only.' }, 409)
      }
      const fileSize = Number(body.fileSize)
      const durationSeconds = Number(body.durationSeconds)
      const fileName = String(body.fileName || 'reviewflow-video').replace(/[\r\n,]/g, '_').slice(0, 200)
      if (!Number.isSafeInteger(fileSize) || fileSize < 1 || fileSize > MAX_FILE_BYTES) {
        return reply({ error: 'Video file must be smaller than 10 GB.' }, 413)
      }
      if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds >= MAX_VIDEO_SECONDS) {
        return reply({ error: 'Videos must be shorter than four hours.' }, 400)
      }

      const maxDuration = Math.ceil(durationSeconds) + 1
      const expiry = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
      const metadata = [
        'name ' + base64(fileName),
        'requiresignedurls',
        'maxDurationSeconds ' + base64(String(maxDuration)),
        'expiry ' + base64(expiry),
      ].join(',')
      const cloudResponse = await fetch('https://api.cloudflare.com/client/v4/accounts/' + encodeURIComponent(accountId) + '/stream?direct_user=true', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + cloudflareToken,
          'Tus-Resumable': '1.0.0',
          'Upload-Length': String(fileSize),
          'Upload-Metadata': metadata,
          'Upload-Creator': user.id,
        },
      })
      if (!cloudResponse.ok) {
        const detail = await cloudResponse.text().catch(() => '')
        console.error('Cloudflare did not create an upload URL:', cloudResponse.status, detail.slice(0, 500))
        return reply({ error: 'Could not prepare secure video upload. Check Cloudflare billing and account settings.' }, 502)
      }
      const uploadUrl = cloudResponse.headers.get('Location')
      const videoId = cloudResponse.headers.get('stream-media-id')
      if (!uploadUrl || !videoId) {
        console.error('Cloudflare upload response omitted Location or stream-media-id.')
        return reply({ error: 'The video host returned an incomplete upload response.' }, 502)
      }
      return reply({ uploadUrl, videoId })
    }

    if (action === 'complete') {
      const videoId = typeof body.videoId === 'string' ? body.videoId : ''
      if (!/^[A-Za-z0-9_-]{16,64}$/.test(videoId)) return reply({ error: 'Invalid video reference.' }, 400)
      const { data: version, error: versionError } = await admin
        .from('project_versions')
        .select('id')
        .eq('project_id', projectId)
        .eq('version_number', versionNumber)
        .maybeSingle()
      if (versionError) return reply({ error: 'Could not verify project version.' }, 500)
      if (!version) return reply({ error: 'Project version not found.' }, 404)

      const { error: updateError } = await admin
        .from('project_versions')
        .update({ video_provider: 'cloudflare', video_asset_id: videoId })
        .eq('id', version.id)
      if (updateError) {
        console.error('Could not save the Cloudflare video reference:', updateError.message)
        return reply({ error: 'The video uploaded, but its project reference could not be saved.' }, 500)
      }
      return reply({ ok: true })
    }

    return reply({ error: 'Unknown upload action.' }, 400)
  } catch (error) {
    console.error('stream-upload failed:', error)
    return reply({ error: 'The secure video upload failed. Please try again.' }, 500)
  }
})
