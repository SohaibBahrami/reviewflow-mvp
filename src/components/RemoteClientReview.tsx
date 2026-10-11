import { useCallback, useEffect, useState } from 'react'
import type { Project } from '../lib/types'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase'
import { useI18n } from '../lib/i18n'
import { ClientReview } from './ClientReview'

interface Props {
  shareToken: string
}

export function RemoteClientReview({ shareToken }: Props) {
  const { t } = useI18n()
  const [project, setProject] = useState<Project | null>(null)
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null)
  const [videoPending, setVideoPending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReview = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true)
    setError('')
    try {
      if (!isSupabaseConfigured) throw new Error('Supabase is not configured.')
      const client = await getSupabaseClient()
      if (!client) throw new Error('Supabase is not configured.')
      const { data, error: invokeError } = await client.functions.invoke('share-review', {
        body: { action: 'load', shareToken },
      })
      if (invokeError) throw invokeError
      if (!data?.project) throw new Error('Review link not found.')
      setProject(data.project as Project)
      setPlaybackUrl(typeof data.playbackUrl === 'string' ? data.playbackUrl : null)
      setVideoPending(data.videoPending === true)
    } catch (reason) {
      console.error('ReviewFlow could not load a shared review.', reason)
      setProject(null)
      setPlaybackUrl(null)
      setError(t('Could not load this client review. Check the link and try again.'))
    } finally {
      if (showSpinner) setLoading(false)
    }
  }, [shareToken, t])

  useEffect(() => {
    void loadReview()
  }, [loadReview])

  const updateReview = useCallback(async (next: Project) => {
    if (!project) return
    setError('')
    setProject(next)
    try {
      const client = await getSupabaseClient()
      if (!client) throw new Error('Supabase is not configured.')
      const newComment = next.comments.find((comment) => !project.comments.some((oldComment) => oldComment.id === comment.id))
      let action: Record<string, unknown> | null = null
      if (newComment) {
        action = {
          action: 'comment',
          shareToken,
          timestampSeconds: newComment.timestamp,
          text: newComment.text,
          authorName: newComment.author,
        }
      } else if (next.status === 'approved' && project.status !== 'approved') {
        action = { action: 'approve', shareToken }
      }
      if (!action) return
      const { error: invokeError } = await client.functions.invoke('share-review', { body: action })
      if (invokeError) throw invokeError
      await loadReview(false)
    } catch (reason) {
      console.error('ReviewFlow could not save client feedback.', reason)
      setError(t('Could not save this review action. Please try again.'))
      await loadReview(false)
    }
  }, [loadReview, project, shareToken, t])

  if (loading) {
    return <section className="narrow-page"><p className="eyebrow">{t('Client review')}</p><h1>{t('Loading client review…')}</h1></section>
  }
  if (!project) {
    return <section className="narrow-page"><p className="eyebrow">{t('Client review')}</p><h1>{t('This review link is invalid or expired. Ask the editor for a new link.')}</h1>{error && <p className="form-error" role="alert">{error}</p>}</section>
  }

  return (
    <section>
      {error && <p className="form-error remote-review-error" role="alert">{error}</p>}
      {videoPending && <p className="shared-review-note">{t('This video is being prepared. Refresh this page in a little while.')}</p>}
      <ClientReview project={project} playbackUrl={playbackUrl} standalone onUpdate={(next) => { void updateReview(next) }} />
    </section>
  )
}
