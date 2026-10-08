import { useState, type FormEvent } from 'react'
import type { Project } from '../lib/types'
import { saveLocalVideo } from '../lib/videoStorage'

export function NewProject({ onCreate }: { onCreate: (project: Project) => void }) {
  const [title, setTitle] = useState('')
  const [client, setClient] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSaving(true)
    const cleanTitle = title.trim() || 'Untitled project'
    const cleanClient = client.trim() || 'New client'
    const videoId = file ? crypto.randomUUID() : undefined

    try {
      if (file && videoId) {
        await saveLocalVideo(videoId, file)
      }
    } catch {
      setError('The video could not be saved in this browser. Try a smaller file or check available storage.')
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
    }
    onCreate(project)
    setSaving(false)
  }

  return (
    <section className="narrow-page">
      <button className="back-link" onClick={() => { window.location.hash = '#/' }}>← Back to projects</button>
      <p className="eyebrow">Create project</p>
      <h1>Start a client review.</h1>
      <p className="hero-copy">
        Add the project details and your current video. After that, you can review the cut yourself or switch to the client view to test the approval flow.
      </p>

      <form className="form-card" onSubmit={submit}>
        <label>
          Project name
          <span className="field-help">Use the name your client will recognize.</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Launch video" autoFocus />
        </label>
        <label>
          Client name
          <span className="field-help">This is shown on the project and client review.</span>
          <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Northstar Coffee" />
        </label>
        <div className="upload-field">
          <span className="upload-label">Video file</span>
          <span className="field-help">Optional in this prototype. The selected video stays in this browser.</span>
          <label className="file-picker">
            <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <span className="file-picker-icon">↑</span>
            <span>Choose a video</span>
            <span className="file-picker-meta">{file ? 'Change file' : 'MP4, MOV, WebM'}</span>
          </label>
          {file && <div className="selected-file">Selected video <strong>{file.name}</strong></div>}
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions">
          <button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving video…' : 'Create project'}</button>
        </div>
      </form>
    </section>
  )
}
