import { useMemo, useRef, useState, type FormEvent } from 'react'
import type { Project } from '../lib/types'
import { formatTime, relativeDate } from '../lib/format'
import { VideoPlayer, type VideoPlayerHandle } from './VideoPlayer'
import { CloudflareStreamPlayer } from './CloudflareStreamPlayer'
import { useI18n } from '../lib/i18n'

interface Props {
  project: Project
  onBack?: () => void
  onUpdate: (project: Project) => void
  standalone?: boolean
  playbackUrl?: string | null
}

export function ClientReview({ project, onBack, onUpdate, standalone = false, playbackUrl = null }: Props) {
  const { t, locale } = useI18n()
  const videoRef = useRef<VideoPlayerHandle | null>(null)
  const [commentText, setCommentText] = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  const [author, setAuthor] = useState(project.client)
  const comments = useMemo(() => [...project.comments].sort((a, b) => a.timestamp - b.timestamp), [project.comments])

  function addComment(event: FormEvent) {
    event.preventDefault()
    if (!commentText.trim() || project.status === 'completed') return
    const next = {
      id: crypto.randomUUID(),
      timestamp: currentTime,
      text: commentText.trim(),
      author: author.trim() || project.client,
      createdAt: new Date().toISOString(),
      status: 'open' as const,
    }
    onUpdate({ ...project, status: 'in_review', comments: [...project.comments, next] })
    setCommentText('')
  }

  function approve() {
    if (project.status !== 'completed') onUpdate({ ...project, status: 'approved' })
  }

  function seekTo(seconds: number) {
    videoRef.current?.seek(seconds)
  }

  return (
    <section className="client-review-page">
      <div className="review-header">
        <div>
          {onBack && <button className="back-link" onClick={onBack}>← {t('Exit client preview')}</button>}
          <p className="eyebrow">{t('Client review')}</p>
          <h1>{project.title}</h1>
          <p className="hero-copy">{t('Version {version}', { version: project.version })} · {t("Leave feedback at a specific moment or approve the video when you're happy.")}</p>
          {standalone && <p className="shared-review-note">{t('You are reviewing a client link. No account is needed for this prototype.')}</p>}
        </div>
        <div className="review-actions">
          <span className={project.status === 'approved' ? 'pill success' : project.status === 'completed' ? 'pill completed' : 'pill'}>
            {project.status === 'approved' ? t('Approved') : project.status === 'completed' ? t('Completed') : t('Needs your review')}
          </span>
          <button className="button button-primary" onClick={approve} disabled={project.status !== 'in_review'}>
            {project.status === 'approved' ? t('✓ Version approved') : project.status === 'completed' ? t('Project completed') : t('Approve this version')}
          </button>
        </div>
      </div>

      <div className="review-guide client-guide" aria-label={t('How to review')}>
        <div><strong>1</strong><span>{t('Play the video')}</span></div>
        <div><strong>2</strong><span>{t('Pause where you want a change')}</span></div>
        <div><strong>3</strong><span>{t('Send feedback or approve')}</span></div>
      </div>

      <div className="review-layout">
        <div className="video-panel">
          {playbackUrl ? (
            <CloudflareStreamPlayer ref={videoRef} src={playbackUrl} title={project.title} onTimeChange={setCurrentTime} />
          ) : project.localVideoUrl ? (
            <VideoPlayer ref={videoRef} src={project.localVideoUrl} onTimeChange={setCurrentTime} />
          ) : (
            <div className="video-empty">
              <div className="play-badge">▶</div>
              <h3>{t('No video uploaded')}</h3>
              <p>{t('The editor has not added a video file yet. You can still test the feedback and approval flow here.')}</p>
            </div>
          )}
        </div>

        <aside className="comments-panel">
          <div className="panel-heading"><div><p className="eyebrow">{t('Your feedback')}</p><h2>{project.comments.length} {t('comments')}</h2></div></div>
          <div className="comment-list">
            {comments.length === 0 && <p className="muted">{t('There is no feedback yet. Start by pausing the video where you want a change.')}</p>}
            {comments.map((comment) => (
              <article key={comment.id} className={comment.status === 'resolved' ? 'comment resolved' : 'comment'}>
                <button className="timestamp" onClick={() => seekTo(comment.timestamp)}>{formatTime(comment.timestamp)}</button>
                <div className="comment-body">
                  <div className="comment-author">{comment.author}</div>
                  <p>{comment.text}</p>
                  <div className="comment-footer"><span>{relativeDate(comment.createdAt, locale)}</span></div>
                </div>
              </article>
            ))}
          </div>
          {project.status === 'completed' ? (
            <div className="completed-review-note">{t('This project has been completed by the editor. This review is now read-only.')}</div>
          ) : (
            <form className="comment-form" onSubmit={addComment}>
              <label className="comment-name-field"><span>{t('Your name')}</span><input value={author} onChange={(event) => setAuthor(event.target.value)} placeholder={project.client} /></label>
              <label className="comment-message-field"><span>{t('What should change?')}</span><textarea value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder={t('e.g. Make this shot a little shorter')} rows={3} required /></label>
              <div className="comment-form-footer"><span className="feedback-time"><span>{t('Feedback time')}</span>{formatTime(currentTime)}</span><button className="button button-primary" type="submit" disabled={!commentText.trim()}>{t('Send feedback')}</button></div>
            </form>
          )}
        </aside>
      </div>
    </section>
  )
}
