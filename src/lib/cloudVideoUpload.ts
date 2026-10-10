import type { SupabaseClient } from '@supabase/supabase-js'

const MAX_VIDEO_SECONDS = 4 * 60 * 60
const CHUNK_SIZE = 8 * 1024 * 1024

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
      if (duration === undefined) reject(new Error('Could not read video duration.'))
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

async function tusUpload(uploadUrl: string, file: File, onProgress: (percent: number) => void) {
  let offset = 0
  while (offset < file.size) {
    const chunk = file.slice(offset, Math.min(offset + CHUNK_SIZE, file.size))
    const response = await fetch(uploadUrl, {
      method: 'PATCH',
      headers: {
        'Tus-Resumable': '1.0.0',
        'Upload-Offset': String(offset),
        'Content-Type': 'application/offset+octet-stream',
      },
      body: chunk,
    })
    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw new Error('Video upload failed (' + response.status + '). ' + detail.slice(0, 240))
    }

    const receivedOffset = Number(response.headers.get('Upload-Offset'))
    offset = Number.isFinite(receivedOffset) && receivedOffset > offset
      ? receivedOffset
      : offset + chunk.size
    onProgress(Math.min(99, Math.round((offset / file.size) * 100)))
  }
  onProgress(100)
}

export async function uploadVideoToCloudflare(
  client: SupabaseClient,
  input: {
    projectId: string
    versionNumber: number
    file: File
    onProgress?: (percent: number) => void
  },
): Promise<string> {
  if (!input.file.size) throw new Error('The selected video is empty.')
  const duration = await readVideoDuration(input.file)

  const created = await client.functions.invoke('stream-upload', {
    body: {
      action: 'create',
      projectId: input.projectId,
      versionNumber: input.versionNumber,
      fileName: input.file.name,
      fileSize: input.file.size,
      durationSeconds: duration,
    },
  })
  if (created.error) throw created.error
  const uploadUrl = created.data?.uploadUrl
  const videoId = created.data?.videoId
  if (typeof uploadUrl !== 'string' || typeof videoId !== 'string') {
    throw new Error('The video host did not return a usable upload URL.')
  }

  await tusUpload(uploadUrl, input.file, (percent) => input.onProgress?.(percent))

  const completed = await client.functions.invoke('stream-upload', {
    body: {
      action: 'complete',
      projectId: input.projectId,
      versionNumber: input.versionNumber,
      videoId,
    },
  })
  if (completed.error) throw completed.error
  if (completed.data?.ok !== true) throw new Error('The video host did not confirm the upload.')
  return videoId
}
