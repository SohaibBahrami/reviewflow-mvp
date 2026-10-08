import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { formatTime } from '../lib/format'

export interface VideoPlayerHandle {
  seek: (seconds: number) => void
}

interface Props {
  src: string
  onTimeChange?: (seconds: number) => void
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, Props>(function VideoPlayer({ src, onTimeChange }, ref) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [lastAudibleVolume, setLastAudibleVolume] = useState(1)

  useImperativeHandle(ref, () => ({
    seek(seconds: number) {
      if (!videoRef.current) return
      videoRef.current.currentTime = seconds
      setCurrentTime(seconds)
      onTimeChange?.(seconds)
    },
  }), [onTimeChange])

  async function togglePlayback() {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      await videoRef.current.play().catch(() => undefined)
    } else {
      videoRef.current.pause()
    }
  }

  function seekBy(delta: number) {
    if (!videoRef.current) return
    const next = Math.max(0, Math.min(duration, videoRef.current.currentTime + delta))
    videoRef.current.currentTime = next
    setCurrentTime(next)
    onTimeChange?.(next)
  }

  function setProgress(value: number) {
    if (!videoRef.current) return
    videoRef.current.currentTime = value
    setCurrentTime(value)
    onTimeChange?.(value)
  }

  function setAudio(value: number) {
    setVolume(value)
    if (value > 0) setLastAudibleVolume(value)
    if (videoRef.current) {
      videoRef.current.volume = value
      videoRef.current.muted = value === 0
    }
  }

  function toggleMute() {
    if (!videoRef.current) return
    if (videoRef.current.muted || volume === 0) {
      const next = lastAudibleVolume || 1
      videoRef.current.muted = false
      videoRef.current.volume = next
      setVolume(next)
      return
    }
    setLastAudibleVolume(volume)
    videoRef.current.muted = true
    videoRef.current.volume = 0
    setVolume(0)
  }

  async function toggleFullscreen() {
    if (!wrapperRef.current) return
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined)
      return
    }
    const request = wrapperRef.current.requestFullscreen?.()
    await request?.catch(() => undefined)
  }

  return (
    <div className="video-player-shell" ref={wrapperRef}>
      <video
        ref={videoRef}
        className="video-player"
        src={src}
        playsInline
        preload="metadata"
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onContextMenu={(event) => event.preventDefault()}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(event) => {
          const next = event.currentTarget.currentTime
          setCurrentTime(next)
          onTimeChange?.(next)
        }}
        onClick={togglePlayback}
      />

      <div className="video-controls" aria-label="Video controls">
        <button type="button" className="video-control-button primary" onClick={togglePlayback} aria-label={playing ? 'Pause video' : 'Play video'}>
          {playing ? '❚❚' : '▶'}
        </button>
        <button type="button" className="video-control-button" onClick={() => seekBy(-5)} aria-label="Go back 5 seconds">
          −5
        </button>
        <button type="button" className="video-control-button" onClick={() => seekBy(5)} aria-label="Go forward 5 seconds">
          +5
        </button>
        <span className="video-time" aria-label={`Current playback time ${formatTime(currentTime)} of ${formatTime(duration)}`}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <input
          className="video-range video-progress"
          type="range"
          min="0"
          max={duration || 0}
          step="0.01"
          value={Math.min(currentTime, duration || 0)}
          onChange={(event) => setProgress(Number(event.target.value))}
          aria-label="Video progress"
          disabled={!duration}
        />
        <div className="video-volume-control">
          <button type="button" className="video-volume-button" onClick={toggleMute}>
            {volume === 0 ? 'Unmute' : 'Mute'}
          </button>
          <input
            className="video-range video-volume-range"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(event) => setAudio(Number(event.target.value))}
            aria-label="Volume"
            aria-valuetext={volume === 0 ? 'Muted' : `${Math.round(volume * 100)} percent`}
          />
        </div>
        <button type="button" className="video-control-button" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
          ⛶
        </button>
      </div>
    </div>
  )
})
