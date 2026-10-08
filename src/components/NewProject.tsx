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
      localVideoUrl: file ? URL.createObjectURL(file) : undefined,
      comments: [],
    }
    onCreate(project)
  }

  return (
    <section className="narrow-page">
      <p className="eyebrow">New review</p>
      <h1>Start a clean client review.</h1>
      <p className="hero-copy">This first prototype keeps everything in your browser. We add cloud storage after the workflow feels right.</p>

      <form className="form-card" onSubmit={submit}>
        <label>
          Project name
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Launch video — v1" autoFocus />
        </label>
        <label>
          Client name
          <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Northstar Coffee" />
        </label>
        <label>
          Video file <span className="muted">(optional for now)</span>
          <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <div className="form-actions">
          <button className="button button-primary" type="submit">Create review</button>
          {file && <span className="muted">{file.name}</span>}
        </div>
      </form>
    </section>
  )
}
