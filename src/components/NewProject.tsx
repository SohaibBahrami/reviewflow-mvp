import { useState, type FormEvent } from 'react'
import type { Project } from '../lib/types'
import { saveLocalVideo } from '../lib/videoStorage'
import { getProjectValidationError } from '../lib/projectRules'
import { useI18n } from '../lib/i18n'

export function NewProject({ onCreate }: { onCreate: (project: Project) => void }) {
  const { t } = useI18n()
  const [title, setTitle] = useState('')
  const [client, setClient] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')

    const cleanTitle = title.trim()
    const cleanClient = client.trim()
    const validationError = getProjectValidationError(cleanTitle, cleanClient, file !== null)
    if (validationError) {
      setError(t(validationError))
      return
    }

    setSaving(true)
    const videoId = file ? crypto.randomUUID() : undefined

    try {
      if (file && videoId) await saveLocalVideo(videoId, file)
    } catch (error) {
      console.error('ReviewFlow could not save the selected video.', error)
      setError(t('The video could not be saved in this browser. Try a smaller file or check available storage.'))
      setSaving(false)
      return
    }

    const project: Project = {
      id: crypto.randomUUID(),
      title: cleanTitle,
      client: cleanClient,
      status: 'in_review',
      version: 1,
      createdAt: new Date().toISOString(),
      shareToken: crypto.randomUUID(),
      localVideoId: videoId,
      comments: [],
      versionHistory: [],
    }
    onCreate(project)
    setSaving(false)
  }

  return (
    <section className="narrow-page">
      <button className="back-link" onClick={() => { window.location.hash = '#/' }}>← {t('Back to projects')}</button>
      <p className="eyebrow">{t('Create project')}</p>
      <h1>{t('Start a client review.')}</h1>
      <p className="hero-copy">
        {t('Add the project details and your current video. After that, you can review the cut yourself or switch to the client view to test the approval flow.')}
      </p>

      <form className="form-card" noValidate onSubmit={submit}>
        <label>
          {t('Project name')}
          <span className="field-help">{t('Required. Use the name your client will recognize.')}</span>
          <input value={title} onChange={(e) => { setTitle(e.target.value); setError('') }} placeholder={t('Launch video')} autoFocus required maxLength={120} aria-required="true" aria-invalid={Boolean(error && !title.trim())} />
        </label>
        <label>
          {t('Client name')}
          <span className="field-help">{t('Required. This is shown on the project and client review.')}</span>
          <input value={client} onChange={(e) => { setClient(e.target.value); setError('') }} placeholder={t('Northstar Coffee')} required maxLength={120} aria-required="true" aria-invalid={Boolean(error && !client.trim())} />
        </label>
        <div className="upload-field">
          <span className="upload-label">{t('Video file')}</span>
          <span className="field-help">{t('Required. The video stays in this browser.')}</span>
          <label className="file-picker">
            <input type="file" accept="video/*" required aria-required="true" aria-invalid={Boolean(error && !file)} onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError('') }} />
            <span className="file-picker-icon">↑</span>
            <span>{t('Choose a video')}</span>
            <span className="file-picker-meta">{file ? t('Change file') : 'MP4, MOV, WebM'}</span>
          </label>
          {file && <div className="selected-file">{t('Selected video')} <strong>{file.name}</strong></div>}
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions">
          <button className="button button-primary" type="submit" disabled={saving}>{saving ? t('Saving video…') : t('Create project')}</button>
        </div>
      </form>
    </section>
  )
}
