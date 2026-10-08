import { useMemo, useRef, useState } from 'react'
import type { Project } from '../lib/types'
import { formatTime, relativeDate } from '../lib/format'
import { VideoPlayer, type VideoPlayerHandle } from './VideoPlayer'

interface Props {
  project: Project
  onBack?: () => void
  onUpdate: (project: Project) => void
  standalone?: boolean
}

export function ClientReview({ project, onBack, onUpdate, standalone = false }: Props) {
  const videoRef = useRef<VideoPlayerHandle | null>(null)
  const [commentText, setCommentText] = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  const [author, setAuthor] = useState(project.client)

  const comments = useMemo(
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
      author: author.trim() || project.client,
      createdAt: new Date().toISOString(),
      status: 'open' as const,
    }

    if (project.status === 'completed') return
    onUpdate({ ...project, status: 'in_review', comments: [...project.comments, next] })
    setCommentText('')
  }

  function approve() {
    onUpdate({ ...project, status: 'approved' })
  }

  function seekTo(seconds: number) {
    videoRef.current?.seek(seconds)
  }

  return (
    <section className="client-review-page">
      <div className="review-header">
        <div>
          {onBack && <button className="back-link" onClick={onBack}>← Exit client preview</button>}
          <p className="eyebrow">Client review</p>
          <h1>{project.title}</h1>
          <p className="hero-copy">Version {project.version} · Leave feedback at a specific moment or approve the video when you're happy.</p>
          {standalone && <p className="shared-review-note">You are reviewing a client link. No account is needed for this prototype.</p>}
        </div>
        <div className="review-actions">
          <span className={project.status === 'approved' ? 'pill success' : project.status === 'completed' ? 'pill completed' : 'pill'}>
            {project.status === 'approved' ? 'Approved' : project.status === 'completed' ? 'Completed' : 'Needs your review'}
          </span>
          <button className="button button-primary" onClick={approve} disabled={project.status !== 'in_review'}>
            {project.status === 'approved' ? '✓ Version approved' : project.status === 'completed' ? 'Project completed' : 'Approve this version'}
          </button>
        </div>
      </div>

      <div className="review-guide client-guide" aria-label="How to review">
        <div><strong>1</strong><span>Play the video</span></div>
        <div><strong>2</strong><span>Pause where you want a change</span></div>
        <div><strong>3</strong><span>Send feedback or approve</span></div>
      </div>

      <div className="review-layout">
        <div className="video-panel">
          {project.localVideoUrl ? (
            <VideoPlayer ref={videoRef} src={project.localVideoUrl} onTimeChange={setCurrentTime} />
          ) : (
            <div className="video-empty">
              <div className="play-badge">▶</div>
              <h3>No video uploaded</h3>
              <p>The editor has not added a video file yet. You can still test the feedback and approval flow here.</p>
            </div>
          )}
        </div>

        <aside className="comments-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Your feedback</p>
              <h2>{project.comments.length} comments</h2>
            </div>
          </div>

          <div className="comment-list">
            {comments.length === 0 && <p className="muted">There is no feedback yet. Start by pausing the video where you want a change.</p>}
            {comments.map((comment) => (
              <article key={comment.id} className={comment.status === 'resolved' ? 'comment resolved' : 'comment'}>
                <button className="timestamp" onClick={() => seekTo(comment.timestamp)}>
                  {formatTime(comment.timestamp)}
                </button>
                <div className="comment-body">
                  <div className="comment-author">{comment.author}</div>
                  <p>{comment.text}</p>
                  <div className="comment-footer">
                    <span>{relativeDate(comment.createdAt)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {project.status === 'completed' ? (
            <div className="completed-review-note">This project has been completed by the editor. This review is now read-only.</div>
          ) : (
          <form className="comment-form" onSubmit={addComment}>
            <label className="comment-name-field">
              <span>Your name</span>
              <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder={project.client} />
            </label>
            <label className="comment-message-field">
              <span>What should change?</span>
              <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="e.g. Make this shot a little shorter" rows={3} />
            </label>
            <div className="comment-form-footer">
              <span className="feedback-time"><span>Feedback time</span>{formatTime(currentTime)}</span>
              <button className="button button-primary" type="submit">Send feedback</button>
            </div>
          </form>
          )}
        </aside>
      </div>
    </section>
  )
}
