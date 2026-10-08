import { useState } from 'react'
import type { Project } from '../lib/types'

export function NewProject({ onCreate }: { onCreate: (project: Project) => void }) {
  const [title, setTitle] = useState('')
  const [client, setClient] = useState('')
  const [file, setFile] = useState<File | null>(null)

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const cleanTitle = title.trim() || 'Untitled project'
    const cleanClient = client.trim() || 'New client'
    const project: Project = {
      id: crypto.randomUUID(),
      title: cleanTitle,
      client: cleanClient,
      status: 'in_review',
      version: 1,
      createdAt: new Date().toISOString(),
      shareToken: crypto.randomUUID(),
      localVideoUrl: file ? URL.createObjectURL(file) : undefined,
      comments: [],
    }
    onCreate(project)
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
        <div className="form-actions">
          <button className="button button-primary" type="submit">Create project</button>
        </div>
      </form>
    </section>
  )
}
