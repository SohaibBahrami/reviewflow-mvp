import type { SupabaseClient } from '@supabase/supabase-js'

const MAX_FILE_BYTES = 250 * 1024 * 1024
const MAX_VIDEO_SECONDS = 10 * 60
const CHUNK_SIZE = 8 * 1024 * 1024
const CHUNKED_THRESHOLD = 95 * 1024 * 1024

interface PreparedUpload {
  reservationId: string
  cloudName: string
  apiKey: string
  timestamp: number
  signature: string
  publicId: string
  type: 'authenticated'
  transformation: string
  eager: string
  maxFileBytes: number
}

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const objectUrl = URL.createObjectURL(file)
    let settled = false
    const finish = (duration?: number) => {
      if (settled) return
      settled = true
      video.removeAttribute('src')
      video.load()
      URL.revokeObjectURL(objectUrl)
      if (duration === undefined) reject(new Error('Could not read the video duration.'))
      else resolve(duration)
    }
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      const duration = video.duration
      if (!Number.isFinite(duration) || duration <= 0 || duration > MAX_VIDEO_SECONDS) {
        finish()
        return
      }
      finish(duration)
    }
    video.onerror = () => finish()
    video.src = objectUrl
  })
}

async function invokeCloudinary(client: SupabaseClient, body: Record<string, unknown>) {
  const { data, error } = await client.functions.invoke('cloudinary-upload', { body })
  if (error) {
    let message = error.message || 'Cloudinary upload failed.'
    const context = (error as unknown as { context?: Response }).context
    if (context && typeof context.clone === 'function') {
      const payload = await context.clone().json().catch(() => null) as { error?: unknown } | null
      if (typeof payload?.error === 'string') message = payload.error
    }
    throw new Error(message)
  }
  if (data?.error) throw new Error(String(data.error))
  return data as Record<string, unknown> | null
}

function uploadForm(file: Blob, fileName: string, prepared: PreparedUpload): FormData {
  const form = new FormData()
  form.append('file', file, fileName)
  form.append('api_key', prepared.apiKey)
  form.append('timestamp', String(prepared.timestamp))
  form.append('signature', prepared.signature)
  form.append('public_id', prepared.publicId)
  form.append('type', prepared.type)
  form.append('transformation', prepared.transformation)
  form.append('eager', prepared.eager)
  return form
}

async function uploadSingle(file: File, prepared: PreparedUpload, onProgress: (percent: number) => void): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', 'https://api.cloudinary.com/v1_1/' + encodeURIComponent(prepared.cloudName) + '/video/upload')
    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) onProgress(Math.min(99, Math.round((event.loaded / event.total) * 99)))
    })
    request.addEventListener('load', () => {
      let body: Record<string, unknown> = {}
      try { body = JSON.parse(request.responseText) as Record<string, unknown> } catch { /* handled as a generic error below */ }
      if (request.status >= 200 && request.status < 300 && body.done !== false) {
        onProgress(99)
        resolve()
      } else {
        reject(new Error(String((body.error as { message?: string } | undefined)?.message || 'Cloudinary rejected the upload.')))
      }
    })
    request.addEventListener('error', () => reject(new Error('The upload connection failed. Please try again.')))
    request.addEventListener('abort', () => reject(new Error('The upload was cancelled.')))
    request.send(uploadForm(file, file.name, prepared))
  })
}

async function uploadInChunks(file: File, prepared: PreparedUpload, onProgress: (percent: number) => void): Promise<void> {
  const uploadId = crypto.randomUUID().replace(/-/g, '')
  let offset = 0
  while (offset < file.size) {
    const end = Math.min(offset + CHUNK_SIZE, file.size)
    const chunk = file.slice(offset, end)
    const response = await fetch('https://api.cloudinary.com/v1_1/' + encodeURIComponent(prepared.cloudName) + '/video/upload', {
      method: 'POST',
      headers: {
        'X-Unique-Upload-Id': uploadId,
        'Content-Range': 'bytes ' + offset + '-' + (end - 1) + '/' + file.size,
      },
      body: uploadForm(chunk, file.name, prepared),
    })
    const body = await response.json().catch(() => ({})) as Record<string, unknown>
    if (!response.ok) {
      const detail = body.error as { message?: string } | undefined
      throw new Error(String(detail?.message || 'Cloudinary rejected an upload chunk (' + response.status + ').'))
    }
    offset = end
    onProgress(Math.min(99, Math.round((offset / file.size) * 99)))
  }
}

export async function uploadVideoToCloudinary(
  client: SupabaseClient,
  input: {
    projectId: string
    versionNumber: number
    file: File
    onProgress?: (percent: number) => void
  },
): Promise<string> {
  if (!input.file.size) throw new Error('The selected video is empty.')
  if (input.file.size > MAX_FILE_BYTES) throw new Error('Videos must be 250 MB or smaller on the free plan.')
  const duration = await readVideoDuration(input.file)
  if (duration > MAX_VIDEO_SECONDS) throw new Error('Videos must be 10 minutes or shorter on the free plan.')

  const preparedData = await invokeCloudinary(client, {
    action: 'prepare',
    projectId: input.projectId,
    versionNumber: input.versionNumber,
    fileName: input.file.name,
    fileSize: input.file.size,
    durationSeconds: duration,
  })
  if (
    typeof preparedData?.reservationId !== 'string' ||
    typeof preparedData.cloudName !== 'string' ||
    typeof preparedData.apiKey !== 'string' ||
    typeof preparedData.timestamp !== 'number' ||
    typeof preparedData.signature !== 'string' ||
    typeof preparedData.publicId !== 'string' ||
    preparedData.type !== 'authenticated' ||
    typeof preparedData.transformation !== 'string' ||
    typeof preparedData.eager !== 'string'
  ) {
    throw new Error('ReviewFlow did not return a valid upload authorization.')
  }

  const prepared = preparedData as unknown as PreparedUpload
  input.onProgress?.(0)
  try {
    if (input.file.size > CHUNKED_THRESHOLD) await uploadInChunks(input.file, prepared, (value) => input.onProgress?.(value))
    else await uploadSingle(input.file, prepared, (value) => input.onProgress?.(value))

    const completed = await invokeCloudinary(client, {
      action: 'complete',
      projectId: input.projectId,
      versionNumber: input.versionNumber,
      reservationId: prepared.reservationId,
      publicId: prepared.publicId,
    })
    if (completed?.ok !== true || completed.publicId !== prepared.publicId) {
      throw new Error('Cloudinary did not confirm the review copy. Please try again.')
    }
    input.onProgress?.(100)
    return prepared.publicId
  } catch (error) {
    await invokeCloudinary(client, { action: 'cancel', reservationId: prepared.reservationId }).catch((cancelError) => {
      console.warn('ReviewFlow could not clean up an incomplete Cloudinary upload.', cancelError)
    })
    throw error
  }
}
