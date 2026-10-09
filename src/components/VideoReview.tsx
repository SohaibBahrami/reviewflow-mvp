import { useMemo, useRef, useState, type FormEvent } from 'react'
import type { Project } from '../lib/types'
import { formatTime, relativeDate } from '../lib/format'
import { VideoPlayer, type VideoPlayerHandle } from './VideoPlayer'
import { useI18n } from '../lib/i18n'

interface Props {
  project: Project
  onBack: () => void
  onClientPreview: () => void
  onUpdate: (project: Project) => void
  onDelete: () => void
  onToggleComplete: () => void
}

export function VideoReview({ project, onBack, onClientPreview, onUpdate, onDelete, onToggleComplete }: Props) {
  const { t, locale } = useI18n()
  const videoRef = useRef<VideoPlayerHandle | null>(null)
  const [commentText, setCommentText] = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  const [author, setAuthor] = useState('You')
  const [copied, setCopied] = useState(false)

  const comments = useMemo(
    () => [...project.comments].sort((a, b) => a.timestamp - b.timestamp),
    [project.comments],
  )

  function addComment(event: FormEvent) {
    event.preventDefault()
    if (!commentText.trim()) return
    const next = {
      id: crypto.randomUUID(),
      timestamp: currentTime,
      text: commentText.trim(),
      author: author.trim() || t('You'),
      createdAt: new Date().toISOString(),
      status: 'open' as const,
    }
    onUpdate({ ...project, comments: [...project.comments, next] })
    setCommentText('')
  }

  function toggleComment(id: string) {
    onUpdate({
      ...project,
      comments: project.comments.map((comment) =>
        comment.id === id ? { ...comment, status: comment.status === 'open' ? 'resolved' : 'open' } : comment,
      ),
    })
  }

  function createVersion() {
    onUpdate({ ...project, version: project.version + 1, status: 'in_review', completedAt: undefined, comments: [] })
  }

  async function copyClientLink() {
    const url = new URL(window.location.href)
    url.hash = `/share/${project.shareToken}`
    if (!navigator.clipboard) return
    await navigator.clipboard.writeText(url.toString())
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  function seekTo(seconds: number) {
    videoRef.current?.seek(seconds)
  }

  return (
    <section>
      <div className="review-header">
        <div>
          <button className="back-link" onClick={onBack}>← {t('Back to projects')}</button>
          <p className="eyebrow">{t('Editor review')}</p>
          <h1>{project.title}</h1>
          <p className="hero-copy">{t('Client: {client}', { client: project.client })} · {t('Version {version}', { version: project.version })}</p>
        </div>
        <div className="review-actions">
          <button className="button button-secondary" onClick={onClientPreview}>{t('Preview as client')}</button>
          <button className="button button-primary" onClick={copyClientLink} disabled={!navigator.clipboard}>
            {copied ? t('Review link copied') : t('Copy review link') }
          </button>
          <button className="button button-secondary" onClick={createVersion}>{t('Start next version')}</button>
          <button className={project.status === 'completed' ? 'button button-secondary' : 'button button-secondary'} onClick={onToggleComplete}>
            {project.status === 'completed' ? t('Reopen project') : t('Mark project complete')}
          </button>
          <button className="button button-danger" onClick={onDelete}>{t('Delete project')}</button>
        </div>
      </div>

      <div className="review-guide" aria-label={t('Review workflow')}>
        <div><strong>1</strong><span>{t('Review the video')}</span></div>
        <div><strong>2</strong><span>{t('Resolve feedback')}</span></div>
        <div><strong>3</strong><span>{t('Send the review link')}</span></div>
      </div>

      <div className="status-banner">
        <span className={project.status === 'approved' ? 'pill success' : project.status === 'completed' ? 'pill completed' : 'pill'}>
          {project.status === 'approved' ? t('Approved by client') : project.status === 'completed' ? t('Project completed') : t('Waiting for client')}
        </span>
        <span className="muted">
          {project.status === 'completed'
            ? t('This project is finished and stored in your completed projects. Reopen it when you need to make more changes.')
            : project.status === 'approved'
              ? t('This version is approved. Mark the project complete when the work is finished.')
              : t('Preview the client view, then copy the review link and send it to your client. This prototype link works only in this browser; cloud sharing comes next.')}
        </span>
      </div>

      <div className="review-layout">
        <div className="video-panel">
          {project.localVideoUrl ? (
            <VideoPlayer ref={videoRef} src={project.localVideoUrl} onTimeChange={setCurrentTime} />
          ) : (
            <div className="video-empty">
              <div className="play-badge">▶</div>
              <h3>{t('No video uploaded')}</h3>
              <p>{t('You can still test comments, timestamps, versioning, and the client preview without a video file.')}</p>
            </div>
          )}
        </div>

        <aside className="comments-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{t('Feedback')}</p>
              <h2>{project.comments.length} {t('comments')}</h2>
            </div>
          </div>

          <div className="comment-list">
            {comments.length === 0 && <p className="muted">{t('No feedback yet. Add a note at the current video time.')}</p>}
            {comments.map((comment) => (
              <article key={comment.id} className={comment.status === 'resolved' ? 'comment resolved' : 'comment'}>
                <button className="timestamp" onClick={() => seekTo(comment.timestamp)}>
                  {formatTime(comment.timestamp)}
                </button>
                <div className="comment-body">
                  <div className="comment-author">{comment.author}</div>
                  <p>{comment.text}</p>
                  <div className="comment-footer">
                    <span>{relativeDate(comment.createdAt, locale)}</span>
                    <button onClick={() => toggleComment(comment.id)}>
                      {comment.status === 'resolved' ? t('Reopen') : t('Resolve')}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <form className="comment-form" onSubmit={addComment}>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder={t('Your name')} aria-label={t('Your name')} />
            <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder={t('What needs to change?')} rows={3} required aria-required="true" />
            <div className="comment-form-footer">
              <span className="feedback-time" aria-live="polite"><span className="feedback-time-status" aria-hidden="true"></span><span>{t('Will submit at')}</span><strong>{formatTime(currentTime)}</strong></span>
              <button className="button button-primary" type="submit" disabled={!commentText.trim()}>{t('Add feedback')}</button>
            </div>
          </form>
        </aside>
      </div>
    </section>
  )
}
