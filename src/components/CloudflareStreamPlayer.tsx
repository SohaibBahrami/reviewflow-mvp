import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { VideoPlayerHandle } from './VideoPlayer'

type StreamPlayerInstance = {
  currentTime: number
  addEventListener: (event: string, callback: () => void) => void
  removeEventListener?: (event: string, callback: () => void) => void
}

declare global {
  interface Window {
    Stream?: (iframe: HTMLIFrameElement) => StreamPlayerInstance
  }
}

interface Props {
  src: string
  title: string
  onTimeChange?: (seconds: number) => void
}

const SDK_URL = 'https://embed.cloudflarestream.com/embed/sdk.latest.js'

export const CloudflareStreamPlayer = forwardRef<VideoPlayerHandle, Props>(
  function CloudflareStreamPlayer({ src, title, onTimeChange }, ref) {
    const iframeRef = useRef<HTMLIFrameElement | null>(null)
    const playerRef = useRef<StreamPlayerInstance | null>(null)

    useEffect(() => {
      let active = true
      let player: StreamPlayerInstance | null = null
      const handleTimeUpdate = () => {
        const time = player?.currentTime
        if (typeof time === 'number' && Number.isFinite(time)) onTimeChange?.(time)
      }
      const attach = () => {
        if (!active || !iframeRef.current || !window.Stream) return
        try {
          player = window.Stream(iframeRef.current)
          playerRef.current = player
          player.addEventListener('timeupdate', handleTimeUpdate)
        } catch (error) {
          console.warn('Cloudflare Stream player controls are unavailable.', error)
        }
      }

      if (window.Stream) {
        attach()
      } else {
        let script = document.querySelector<HTMLScriptElement>('script[data-reviewflow-stream-sdk="true"]')
        if (!script) {
          script = document.createElement('script')
          script.src = SDK_URL
          script.async = true
          script.dataset.reviewflowStreamSdk = 'true'
          document.head.appendChild(script)
        }
        script.addEventListener('load', attach)
        return () => {
          active = false
          script?.removeEventListener('load', attach)
          if (player) player.removeEventListener?.('timeupdate', handleTimeUpdate)
          if (playerRef.current === player) playerRef.current = null
        }
      }

      return () => {
        active = false
        if (player) player.removeEventListener?.('timeupdate', handleTimeUpdate)
        if (playerRef.current === player) playerRef.current = null
      }
    }, [src, onTimeChange])

    useImperativeHandle(ref, () => ({
      seek(seconds: number) {
        if (playerRef.current) playerRef.current.currentTime = seconds
      },
      reload() {
        if (iframeRef.current) iframeRef.current.src = iframeRef.current.src
      },
    }), [])

    return (
      <iframe
        ref={iframeRef}
        className="cloudflare-stream-player"
        src={src}
        title={title}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
        loading="lazy"
      />
    )
  },
)
