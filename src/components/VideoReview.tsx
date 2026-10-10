import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import type { Project, ProjectVersionSnapshot } from '../lib/types'
import { formatTime, relativeDate } from '../lib/format'
import { VideoPlayer, type VideoPlayerHandle } from './VideoPlayer'
import { useI18n } from '../lib/i18n'
import { startNextVersion } from '../lib/projectRules'
import { getLocalVideo, saveLocalVideo } from '../lib/videoStorage'

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
  const [showNewVersionForm, setShowNewVersionForm] = useState(false)
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null)
  const [newVersionError, setNewVersionError] = useState('')
  const [savingVersion, setSavingVersion] = useState(false)
  const [previewVersion, setPreviewVersion] = useState<ProjectVersionSnapshot | null>(null)
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null)
  const [loadingHistoryVideo, setLoadingHistoryVideo] = useState(false)
  const [historyVideoError, setHistoryVideoError] = useState('')
  const historyPreviewRequestRef = useRef(0)

  const displayedComments = useMemo(
    () => [...(previewVersion ? previewVersion.comments : project.comments)].sort((a, b) => a.timestamp - b.timestamp),
    [previewVersion, project.comments],
  )
  const displayedVideoUrl = previewVersion ? previewVideoUrl : project.localVideoUrl
  const displayedVideoId = previewVersion?.localVideoId ?? project.localVideoId
  const displayedVersionNumber = previewVersion?.version ?? project.version

  useEffect(() => {
    const url = previewVideoUrl
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [previewVideoUrl])

  useEffect(() => () => {
    historyPreviewRequestRef.current += 1
  }, [])

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

  function openNewVersionForm() {
    setShowNewVersionForm(true)
    setNewVersionFile(null)
    setNewVersionError('')
  }

  async function createVersion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newVersionFile || savingVersion) {
      if (!newVersionFile) setNewVersionError(t('Select a video file before creating the project.'))
      return
    }

    setNewVersionError('')
    setSavingVersion(true)
    const localVideoId = crypto.randomUUID()

    try {
      await saveLocalVideo(localVideoId, newVersionFile)
      onUpdate(startNextVersion(project, {
        localVideoId,
        localVideoName: newVersionFile.name,
      }))
      setShowNewVersionForm(false)
      setNewVersionFile(null)
      setCurrentTime(0)
    } catch (error) {
      console.error('ReviewFlow could not create a new video version.', error)
      setNewVersionError(t('The video could not be saved in this browser. Try a smaller file or check available storage.'))
    } finally {
      setSavingVersion(false)
    }
  }

  async function previewPreviousVersion(version: ProjectVersionSnapshot) {
    if (!version.localVideoId || loadingHistoryVideo) {
      if (!version.localVideoId) setHistoryVideoError(t('Video not saved for this version.'))
      return
    }

    const requestId = ++historyPreviewRequestRef.current
    setLoadingHistoryVideo(true)
    setHistoryVideoError('')

    try {
      const blob = await getLocalVideo(version.localVideoId)
      if (requestId !== historyPreviewRequestRef.current) return
      if (!blob) {
        setHistoryVideoError(t('The saved video for this version could not be found. It may have been removed from browser storage.'))
        return
      }

      setPreviewVideoUrl(URL.createObjectURL(blob))
      setPreviewVersion(version)
      setCurrentTime(0)
    } catch (error) {
      console.error('ReviewFlow could not open the archived video.', error)
      if (requestId === historyPreviewRequestRef.current) {
        setHistoryVideoError(t('The saved video for this version could not be found. It may have been removed from browser storage.'))
      }
    } finally {
      if (requestId === historyPreviewRequestRef.current) setLoadingHistoryVideo(false)
    }
  }

  function returnToCurrentVersion() {
    historyPreviewRequestRef.current += 1
    setLoadingHistoryVideo(false)
    setPreviewVersion(null)
    setPreviewVideoUrl(null)
    setHistoryVideoError('')
    setCurrentTime(0)
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
          <p className="hero-copy">{t('Client: {client}', { client: project.client })} · {t('Version {version}', { version: displayedVersionNumber })}</p>
        </div>
        <div className="review-actions">
          <button className="button button-secondary" onClick={onClientPreview}>{t('Preview as client')}</button>
          <button className="button button-primary" onClick={copyClientLink} disabled={!navigator.clipboard}>
            {copied ? t('Review link copied') : t('Copy review link') }
          </button>
          {!previewVersion && <button className="button button-secondary" onClick={openNewVersionForm}>{t('Start next version')}</button>}
          <button className={project.status === 'completed' ? 'button button-secondary' : 'button button-secondary'} onClick={onToggleComplete}>
            {project.status === 'completed' ? t('Reopen project') : t('Mark project complete')}
          </button>
          <button className="button button-danger" onClick={onDelete}>{t('Delete project')}</button>
        </div>
      </div>

      {showNewVersionForm && !previewVersion && (
        <form className="form-card version-upload-form" noValidate onSubmit={createVersion}>
          <p className="hero-copy">{t('Choose a replacement video to start version {version}.', { version: project.version + 1 })}</p>
          <div className="upload-field">
            <span className="upload-label">{t('Video file')}</span>
            <span className="field-help">{t('Required. The video stays in this browser.')}</span>
            <label className="file-picker">
              <input
                type="file"
                accept="video/*"
                required
                aria-required="true"
                onChange={(event) => {
                  setNewVersionFile(event.target.files?.[0] ?? null)
                  setNewVersionError('')
                }}
              />
              <span className="file-picker-icon">↑</span>
              <span>{t('Choose a video')}</span>
              <span className="file-picker-meta">{newVersionFile ? t('Change file') : 'MP4, MOV, WebM'}</span>
            </label>
            {newVersionFile && <div className="selected-file">{t('Selected video')} <strong>{newVersionFile.name}</strong></div>}
          </div>
          {newVersionError && <p className="form-error" role="alert">{newVersionError}</p>}
          <div className="form-actions">
            <button
              type="button"
              className="button button-secondary"
              disabled={savingVersion}
              onClick={() => { setShowNewVersionForm(false); setNewVersionFile(null); setNewVersionError('') }}
            >
              {t('Cancel')}
            </button>
            <button className="button button-primary" type="submit" disabled={!newVersionFile || savingVersion}>
              {savingVersion ? t('Saving video…') : t('Create version')}
            </button>
          </div>
        </form>
      )}

      <div className="review-guide" aria-label={t('Review workflow')}>
        <div><strong>1</strong><span>{t('Review the video')}</span></div>
        <div><strong>2</strong><span>{t('Resolve feedback')}</span></div>
        <div><strong>3</strong><span>{t('Send the review link')}</span></div>
      </div>

      <div className="status-banner">
        {previewVersion ? (
          <>
            <span className="pill">{t('Version {version}', { version: previewVersion.version })}</span>
            <span className="muted">{t('You are viewing an archived version. Feedback is read-only.')}</span>
            <button className="button button-secondary" type="button" onClick={returnToCurrentVersion}>{t('Return to current version')}</button>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
      {historyVideoError && <p className="form-error history-preview-error" role="alert">{historyVideoError}</p>}

      <div className="review-layout">
        <div className="video-panel">
          {displayedVideoUrl ? (
            <VideoPlayer key={displayedVideoId ?? 'current-video'} ref={videoRef} src={displayedVideoUrl} onTimeChange={setCurrentTime} />
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
              <p className="eyebrow">
                {previewVersion ? t('Version {version} feedback', { version: previewVersion.version }) : t('Feedback')}
              </p>
              <h2>{displayedComments.length} {t('comments')}</h2>
            </div>
          </div>

          <div className="comment-list">
            {displayedComments.length === 0 && <p className="muted">{t('No feedback yet. Add a note at the current video time.')}</p>}
            {displayedComments.map((comment) => (
              <article key={comment.id} className={comment.status === 'resolved' ? 'comment resolved' : 'comment'}>
                <button className="timestamp" onClick={() => seekTo(comment.timestamp)}>
                  {formatTime(comment.timestamp)}
                </button>
                <div className="comment-body">
                  <div className="comment-author">{comment.author}</div>
                  <p>{comment.text}</p>
                  <div className="comment-footer">
                    <span>{relativeDate(comment.createdAt, locale)}</span>
                    {previewVersion ? (
                      <span>{comment.status === 'resolved' ? t('Resolved') : t('Open')}</span>
                    ) : (
                      <button onClick={() => toggleComment(comment.id)}>
                        {comment.status === 'resolved' ? t('Reopen') : t('Resolve')}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {!previewVersion && project.versionHistory.length > 0 && (
            <section className="version-history" aria-label={t('Previous versions')}>
              <p className="eyebrow">{t('Previous versions')}</p>
              <p className="muted version-history-note">{t('Feedback from earlier versions is kept here for reference.')}</p>
              <div className="version-history-list">
                {[...project.versionHistory].sort((a, b) => b.version - a.version).map((version) => (
                  <details className="version-history-item" key={version.version}>
                    <summary>
                      <strong>{t('Version {version}', { version: version.version })}</strong>
                      <span className="muted">
                        {version.status === 'approved' ? t('Approved') : version.status === 'completed' ? t('Completed') : t('In review')}
                        {' · '}{t('Version feedback count', { count: version.comments.length })}
                      </span>
                    </summary>
                    <div className="version-history-video-actions">
                      {version.localVideoId ? (
                        <button
                          className="button button-secondary"
                          type="button"
                          disabled={loadingHistoryVideo}
                          onClick={() => void previewPreviousVersion(version)}
                        >
                          {loadingHistoryVideo ? t('Working…') : t('Preview video')}
                        </button>
                      ) : (
                        <span className="muted">{t('Video not saved for this version.')}</span>
                      )}
                      {version.localVideoName && <span className="muted version-video-name">{version.localVideoName}</span>}
                    </div>
                    <div className="version-history-comments">
                      {version.comments.length === 0 ? (
                        <p className="muted">{t('No feedback was recorded for this version.')}</p>
                      ) : version.comments.slice().sort((a, b) => a.timestamp - b.timestamp).map((comment) => (
                        <article key={comment.id} className={comment.status === 'resolved' ? 'comment resolved' : 'comment'}>
                          <span className="timestamp">{formatTime(comment.timestamp)}</span>
                          <div className="comment-body">
                            <div className="comment-author">{comment.author}</div>
                            <p>{comment.text}</p>
                            <div className="comment-footer">
                              <span>{relativeDate(comment.createdAt, locale)}</span>
                              <span>{comment.status === 'resolved' ? t('Resolved') : t('Open')}</span>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {!previewVersion && <form className="comment-form" onSubmit={addComment}>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder={t('Your name')} aria-label={t('Your name')} />
            <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder={t('What needs to change?')} rows={3} required aria-required="true" />
            <div className="comment-form-footer">
              <span className="feedback-time" aria-live="polite"><span className="feedback-time-status" aria-hidden="true"></span><span>{t('Will submit at')}</span><strong>{formatTime(currentTime)}</strong></span>
              <button className="button button-primary" type="submit" disabled={!commentText.trim()}>{t('Add feedback')}</button>
            </div>
          </form>}
        </aside>
      </div>
    </section>
  )
}
