import { useMemo, useRef, useState } from 'react'
import type { Project } from '../lib/types'
import { formatTime, relativeDate } from '../lib/format'

interface Props {
  project: Project
  onBack: () => void
  onUpdate: (project: Project) => void
}

export function VideoReview({ project, onBack, onUpdate }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [commentText, setCommentText] = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  const [author, setAuthor] = useState('You')

  const openComments = useMemo(
    () => [...project.comments].sort((a, b) => a.timestamp - b.timestamp),
    [project.comments],
  )

  function addComment(event: React.FormEvent) {
    event.preventDefault()
    if (!commentText.trim()) return
    const next = {
      id: crypto.randomUUID(),
      timestamp: currentTime,
      text: commentText.trim(),
      author: author.trim() || 'You',
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

  function approve() {
    onUpdate({ ...project, status: 'approved' })
  }

  function seekTo(seconds: number) {
    if (!videoRef.current) return
    videoRef.current.currentTime = seconds
    videoRef.current.play().catch(() => undefined)
  }

  return (
    <section>
      <div className="review-header">
        <div>
          <button className="back-link" onClick={onBack}>← Back to projects</button>
          <p className="eyebrow">Client review</p>
          <h1>{project.title}</h1>
          <p className="hero-copy">{project.client} · Version {project.version}</p>
        </div>
        <div className="review-actions">
          <button className="button button-secondary" onClick={() => navigator.clipboard?.writeText(window.location.href)}>Copy review link</button>
          <button className="button button-primary" onClick={approve}>✓ Approve version</button>
        </div>
      </div>

      <div className="review-layout">
        <div className="video-panel">
          {project.localVideoUrl ? (
            <video
              ref={videoRef}
              className="video-player"
              src={project.localVideoUrl}
              controls
              onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
            />
          ) : (
            <div className="video-empty">
              <div className="play-badge">▶</div>
              <h3>No video uploaded</h3>
              <p>For now, you can still test the review workflow using the demo comments.</p>
            </div>
          )}
          <div className="time-chip">Current time: {formatTime(currentTime)}</div>
        </div>

        <aside className="comments-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Feedback</p>
              <h2>{project.comments.length} comments</h2>
            </div>
            <span className={project.status === 'approved' ? 'pill success' : 'pill'}>
              {project.status === 'approved' ? 'Approved' : 'Awaiting approval'}
            </span>
          </div>

          <div className="comment-list">
            {openComments.length === 0 && <p className="muted">No feedback yet. Add the first comment below.</p>}
            {openComments.map((comment) => (
              <article key={comment.id} className={comment.status === 'resolved' ? 'comment resolved' : 'comment'}>
                <button className="timestamp" onClick={() => seekTo(comment.timestamp)}>
                  {formatTime(comment.timestamp)}
                </button>
                <div className="comment-body">
                  <div className="comment-author">{comment.author}</div>
                  <p>{comment.text}</p>
                  <div className="comment-footer">
                    <span>{relativeDate(comment.createdAt)}</span>
                    <button onClick={() => toggleComment(comment.id)}>
                      {comment.status === 'resolved' ? 'Reopen' : 'Resolve'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <form className="comment-form" onSubmit={addComment}>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Your name" aria-label="Your name" />
            <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="What should change here?" rows={3} />
            <div className="comment-form-footer">
              <span className="muted">Timestamped at {formatTime(currentTime)}</span>
              <button className="button button-primary" type="submit">Add comment</button>
            </div>
          </form>
        </aside>
      </div>
    </section>
  )
}
