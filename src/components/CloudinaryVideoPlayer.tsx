import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from 'react'
import type { VideoPlayerHandle } from './VideoPlayer'
import { useI18n } from '../lib/i18n'

type CloudinaryPlayer = {
  currentTime: (seconds?: number) => number | CloudinaryPlayer
  source: (url: string, options?: Record<string, unknown>) => unknown
  on: (event: string, callback: () => void) => void
  off?: (event: string, callback: () => void) => void
  dispose: () => void
}

declare global {
  interface Window {
    cloudinary?: {
      videoPlayer: (elementId: string, options: Record<string, unknown>) => CloudinaryPlayer
    }
  }
}

const VERSION = '4.0.1'
const SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/cloudinary-video-player@' + VERSION + '/dist/player-full.min.js'
const STYLES_URL = 'https://cdn.jsdelivr.net/npm/cloudinary-video-player@' + VERSION + '/dist/player.min.css'

let scriptPromise: Promise<void> | null = null

function ensurePlayerScript(): Promise<void> {
  if (window.cloudinary?.videoPlayer) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.crossOrigin = 'anonymous'
    script.referrerPolicy = 'no-referrer'
    script.onload = () => {
      if (window.cloudinary?.videoPlayer) resolve()
      else {
        scriptPromise = null
        reject(new Error('The video player library did not initialize.'))
      }
    }
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('The video player library could not be loaded.'))
    }
    document.head.appendChild(script)
  })

  return scriptPromise
}

function ensurePlayerStyles(): void {
  if (document.querySelector('link[data-reviewflow-cloudinary-player="true"]')) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = STYLES_URL
  link.crossOrigin = 'anonymous'
  link.referrerPolicy = 'no-referrer'
  link.dataset.reviewflowCloudinaryPlayer = 'true'
  document.head.appendChild(link)
}

interface Props {
  src: string
  cloudName: string
  title: string
  watermarkText: string
  onTimeChange?: (seconds: number) => void
}

export const CloudinaryVideoPlayer = forwardRef<VideoPlayerHandle, Props>(
  function CloudinaryVideoPlayer({ src, cloudName, title, watermarkText, onTimeChange }, ref) {
    const { t } = useI18n()
    const playerId = 'reviewflow-player-' + useId().replace(/:/g, '')
    const playerRef = useRef<CloudinaryPlayer | null>(null)
    const onTimeChangeRef = useRef(onTimeChange)
    const [playerError, setPlayerError] = useState(false)

    useEffect(() => {
      onTimeChangeRef.current = onTimeChange
    }, [onTimeChange])

    useEffect(() => {
      let active = true
      let player: CloudinaryPlayer | null = null
      const updateTime = () => {
        const time = player?.currentTime()
        if (typeof time === 'number' && Number.isFinite(time)) onTimeChangeRef.current?.(time)
      }
      const handleError = () => {
        if (active) setPlayerError(true)
      }

      setPlayerError(false)
      ensurePlayerStyles()
      void ensurePlayerScript()
        .then(() => {
          if (!active || !window.cloudinary?.videoPlayer) return
          player = window.cloudinary.videoPlayer(playerId, {
            cloudName,
            controls: true,
            autoplay: false,
            preload: 'metadata',
            sourceTypes: ['hls'],
            fluid: true,
            aspectRatio: '16:9',
            analytics: false,
            cloudinaryAnalytics: false,
            allowUsageReport: false,
          })
          playerRef.current = player
          player.on('timeupdate', updateTime)
          player.on('loadedmetadata', updateTime)
          player.on('error', handleError)
          player.source(src, { sourceTypes: ['hls'] })
        })
        .catch((error) => {
          console.error('ReviewFlow could not initialize the Cloudinary video player.', error)
          handleError()
        })

      return () => {
        active = false
        if (player) {
          player.off?.('timeupdate', updateTime)
          player.off?.('loadedmetadata', updateTime)
          player.off?.('error', handleError)
          player.dispose()
        }
        if (playerRef.current === player) playerRef.current = null
      }
    }, [cloudName, playerId, src])

    useImperativeHandle(ref, () => ({
      seek(seconds: number) {
        playerRef.current?.currentTime(seconds)
      },
      reload() {
        playerRef.current?.source(src, { sourceTypes: ['hls'] })
      },
    }), [src])

    return (
      <div className="cloudinary-player-shell">
        <video
          id={playerId}
          className="cld-video-player cld-fluid"
          controls
          playsInline
          preload="metadata"
          aria-label={title}
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture
          onContextMenu={(event) => event.preventDefault()}
        />
        <div className="review-copy-watermark" aria-hidden="true">
          <span>{watermarkText || 'REVIEW COPY'}</span>
        </div>
        {playerError && (
          <div className="cloudinary-player-error" role="alert">
            <strong>{t("We couldn't play this video.")}</strong>
            <span>{t('The video may be unavailable or the browser may have trouble decoding it. Try loading it again.')}</span>
          </div>
        )}
      </div>
    )
  },
)
