import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

const MAX_FILE_BYTES = 250 * 1024 * 1024
const MAX_VIDEO_SECONDS = 10 * 60
const MAX_FILENAME_LENGTH = 160
const EAGER_TRANSFORMATION = 'sp_hd/f_m3u8'
const REVIEW_COPY_TRANSFORMATION = 'c_limit,w_1280,h_720,q_auto:good/l_text:Arial_24_bold:REVIEW%20COPY/fl_layer_apply,g_south_east,x_32,y_24'

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

function encodePath(value: string) {
  return value.split('/').map((part) => encodeURIComponent(part)).join('/')
}

function bytesToHex(value: ArrayBuffer) {
  return Array.from(new Uint8Array(value)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function uploadSignature(params: Record<string, string>, secret: string) {
  const serialized = Object.keys(params).sort().map((key) => key + '=' + params[key]).join('&')
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(serialized + secret))
  return bytesToHex(digest)
}

async function deliverySignature(path: string, secret: string) {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(path + secret))
  const binary = Array.from(new Uint8Array(digest)).map((byte) => String.fromCharCode(byte)).join('')
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '').slice(0, 8)
}

function configuration() {
  return {
    supabaseUrl: Deno.env.get('SUPABASE_URL') || '',
    serviceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    cloudName: Deno.env.get('CLOUDINARY_CLOUD_NAME') || '',
    apiKey: Deno.env.get('CLOUDINARY_API_KEY') || '',
    apiSecret: Deno.env.get('CLOUDINARY_API_SECRET') || '',
  }
}

function cloudinaryReady(config: ReturnType<typeof configuration>) {
  return Boolean(config.cloudName && config.apiKey && config.apiSecret)
}

function mapQuotaError(message: string) {
  if (message.toLowerCase().includes('quota') || message.toLowerCase().includes('storage limit')) return message
  if (message.toLowerCase().includes('10-minute') || message.toLowerCase().includes('250 mb')) return message
  return 'Could not reserve a video upload. Please try again.'
}

async function getCloudinaryResource(config: ReturnType<typeof configuration>, publicId: string) {
  const url = 'https://api.cloudinary.com/v1_1/' + encodeURIComponent(config.cloudName) +
    '/resources/video/authenticated/' + encodePath(publicId)
  return fetch(url, {
    headers: { Authorization: 'Basic ' + btoa(config.apiKey + ':' + config.apiSecret) },
  })
}

async function deleteCloudinaryResources(config: ReturnType<typeof configuration>, publicIds: string[]) {
  if (publicIds.length === 0) return true
  const response = await fetch(
    'https://api.cloudinary.com/v1_1/' + encodeURIComponent(config.cloudName) + '/resources/video/authenticated',
    {
      method: 'DELETE',
      headers: {
        Authorization: 'Basic ' + btoa(config.apiKey + ':' + config.apiSecret),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ public_ids: publicIds, invalidate: true }),
    },
  )
  return response.ok
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return reply({ error: 'Method not allowed.' }, 405)

  try {
    const config = configuration()
    if (!config.supabaseUrl || !config.serviceKey) {
      return reply({ error: 'ReviewFlow account storage is not configured.' }, 503)
    }

    const authorization = request.headers.get('Authorization') || ''
    const match = authorization.match(/^Bearer\s+(.+)$/i)
    if (!match) return reply({ error: 'Sign in before managing review videos.' }, 401)

    const admin = createClient(config.supabaseUrl, config.serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: authData, error: authError } = await admin.auth.getUser(match[1])
    const user = authData.user
    if (authError || !user) return reply({ error: 'Your session is invalid. Sign in again.' }, 401)

    const body = await request.json()
    const action = typeof body?.action === 'string' ? body.action : ''

    if (action === 'cancel') {
      if (!cloudinaryReady(config)) return reply({ error: 'Cloudinary is not configured yet.' }, 503)
      const reservationId = typeof body.reservationId === 'string' ? body.reservationId : ''
      const { data: reservation, error: reservationError } = await admin
        .from('cloudinary_video_reservations')
        .select('id, owner_id, public_id, uploaded_at, active')
        .eq('id', reservationId)
        .eq('owner_id', user.id)
        .maybeSingle()
      if (reservationError || !reservation) return reply({ ok: true })
      if (reservation.uploaded_at) return reply({ error: 'This video is already registered; remove the project to delete it.' }, 409)
      await deleteCloudinaryResources(config, [reservation.public_id])
      await admin.from('cloudinary_video_reservations').update({ active: false }).eq('id', reservation.id).eq('owner_id', user.id)
      return reply({ ok: true })
    }

    if (action === 'delete-project') {
      if (!cloudinaryReady(config)) return reply({ error: 'Cloudinary is not configured yet.' }, 503)
      const projectId = typeof body.projectId === 'string' ? body.projectId : ''
      if (!projectId) return reply({ error: 'A project is required.' }, 400)
      const { data: project, error: projectError } = await admin
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('owner_id', user.id)
        .maybeSingle()
      if (projectError) return reply({ error: 'Could not verify project ownership.' }, 500)
      if (!project) return reply({ error: 'Project not found.' }, 404)
      const { data: rows, error: listError } = await admin
        .from('cloudinary_video_reservations')
        .select('id, public_id')
        .eq('owner_id', user.id)
        .eq('project_id', projectId)
        .eq('active', true)
        .not('uploaded_at', 'is', null)
      if (listError) return reply({ error: 'Could not list this project’s video assets.' }, 500)
      const publicIds = (rows || []).map((row) => String(row.public_id))
      if (!await deleteCloudinaryResources(config, publicIds)) {
        return reply({ error: 'Cloudinary could not delete the review copy. The project has been kept in Trash so you can retry.' }, 502)
      }
      const { error: markError } = await admin
        .from('cloudinary_video_reservations')
        .update({ active: false })
        .eq('owner_id', user.id)
        .eq('project_id', projectId)
      if (markError) return reply({ error: 'The video was removed but quota tracking could not be updated.' }, 500)
      return reply({ ok: true })
    }

    if (!cloudinaryReady(config)) {
      return reply({ error: 'Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to Supabase Edge Function secrets.' }, 503)
    }

    const projectId = typeof body.projectId === 'string' ? body.projectId : ''
    const versionNumber = Number(body.versionNumber)
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
    if (project.status === 'completed') return reply({ error: 'Reopen the project before uploading a review video.' }, 409)
    if (project.current_version !== versionNumber) return reply({ error: 'Upload a video for the current version only.' }, 409)

    if (action === 'prepare') {
      const fileSize = Number(body.fileSize)
      const durationSeconds = Number(body.durationSeconds)
      const fileName = String(body.fileName || 'reviewflow-video').replace(/[\r\n]/g, '_').slice(0, MAX_FILENAME_LENGTH)
      if (!Number.isSafeInteger(fileSize) || fileSize < 1 || fileSize > MAX_FILE_BYTES) {
        return reply({ error: 'Videos must be 250 MB or smaller on the free plan.' }, 413)
      }
      if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > MAX_VIDEO_SECONDS) {
        return reply({ error: 'Videos must be 10 minutes or shorter on the free plan.' }, 400)
      }

      const publicId = 'reviewflow/' + user.id + '/' + projectId + '/v' + versionNumber + '_' + crypto.randomUUID()
      const { data: reserved, error: reserveError } = await admin.rpc('reserve_cloudinary_video_upload', {
        p_owner_id: user.id,
        p_project_id: projectId,
        p_version_number: versionNumber,
        p_file_bytes: fileSize,
        p_duration_seconds: Math.round(durationSeconds * 1000) / 1000,
        p_public_id: publicId,
      })
      if (reserveError || !reserved?.reservation_id) {
        const message = mapQuotaError(reserveError?.message || '')
        return reply({ error: message }, 429)
      }

      const timestamp = Math.floor(Date.now() / 1000)
      const fields = {
        eager: EAGER_TRANSFORMATION,
        public_id: publicId,
        timestamp: String(timestamp),
        transformation: REVIEW_COPY_TRANSFORMATION,
        type: 'authenticated',
      }
      const signature = await uploadSignature(fields, config.apiSecret)
      return reply({
        reservationId: reserved.reservation_id,
        cloudName: config.cloudName,
        apiKey: config.apiKey,
        timestamp,
        signature,
        publicId,
        type: 'authenticated',
        transformation: REVIEW_COPY_TRANSFORMATION,
        eager: EAGER_TRANSFORMATION,
        maxFileBytes: MAX_FILE_BYTES,
      })
    }

    if (action === 'complete') {
      const reservationId = typeof body.reservationId === 'string' ? body.reservationId : ''
      const publicId = typeof body.publicId === 'string' ? body.publicId : ''
      const { data: reservation, error: reservationError } = await admin
        .from('cloudinary_video_reservations')
        .select('id, owner_id, project_id, version_number, public_id, input_bytes, duration_seconds, uploaded_at, active')
        .eq('id', reservationId)
        .eq('owner_id', user.id)
        .eq('project_id', projectId)
        .eq('version_number', versionNumber)
        .eq('active', true)
        .maybeSingle()
      if (reservationError || !reservation) return reply({ error: 'The upload reservation expired. Start the upload again.' }, 409)
      if (reservation.public_id !== publicId) return reply({ error: 'The uploaded video reference did not match the reservation.' }, 400)
      if (reservation.uploaded_at) return reply({ ok: true, publicId })

      const assetResponse = await getCloudinaryResource(config, publicId)
      if (!assetResponse.ok) {
        const detail = await assetResponse.text().catch(() => '')
        console.error('Cloudinary asset verification failed:', assetResponse.status, detail.slice(0, 300))
        return reply({ error: 'Cloudinary has not finished preparing the review copy. Retry shortly.' }, 409)
      }
      const asset = await assetResponse.json()
      const result = asset?.public_id === publicId && asset?.type === 'authenticated' ? asset : null
      if (!result || Number(result.bytes) <= 0 || Number(result.duration) <= 0 || Number(result.duration) > MAX_VIDEO_SECONDS + 1) {
        return reply({ error: 'Cloudinary returned an invalid review-copy asset.' }, 502)
      }

      const { error: versionError } = await admin
        .from('project_versions')
        .update({ video_provider: 'cloudinary', video_asset_id: publicId })
        .eq('project_id', projectId)
        .eq('version_number', versionNumber)
      if (versionError) return reply({ error: 'The video uploaded but its project reference could not be saved.' }, 500)

      const { error: reservationUpdateError } = await admin
        .from('cloudinary_video_reservations')
        .update({ uploaded_at: new Date().toISOString(), stored_bytes: Number(result.bytes) })
        .eq('id', reservation.id)
        .eq('owner_id', user.id)
      if (reservationUpdateError) return reply({ error: 'The video uploaded but its free-plan quota could not be updated.' }, 500)

      return reply({ ok: true, publicId })
    }

    return reply({ error: 'Unknown upload action.' }, 400)
  } catch (error) {
    console.error('cloudinary-upload failed:', error)
    return reply({ error: 'The Cloudinary video operation failed. Please try again.' }, 500)
  }
})
