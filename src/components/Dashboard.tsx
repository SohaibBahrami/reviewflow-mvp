import type { Project } from '../lib/types'
import { relativeDate } from '../lib/format'

type Props = {
  projects: Project[]
  onNew: () => void
  onOpen: (id: string) => void
}

export function Dashboard({ projects, onNew, onOpen }: Props) {
  const activeCount = projects.filter((p) => p.status === 'in_review').length
  const openComments = projects.reduce(
    (sum, project) => sum + project.comments.filter((comment) => comment.status === 'open').length,
    0,
  )
  const approvedCount = projects.filter((p) => p.status === 'approved').length

  return (
    <section>
      <div className="hero-row">
        <div>
          <p className="eyebrow">Projects</p>
          <h1>Keep every client review in one place.</h1>
          <p className="hero-copy">
            Create a project, upload a cut, send your client a review link, and keep every comment tied to the video.
          </p>
        </div>
        <button className="button button-primary" onClick={onNew}>Create project</button>
      </div>

      <div className="stat-grid" aria-label="Project summary">
        <div className="stat-card"><span>Projects in review</span><strong>{activeCount}</strong></div>
        <div className="stat-card"><span>Open feedback</span><strong>{openComments}</strong></div>
        <div className="stat-card"><span>Approved projects</span><strong>{approvedCount}</strong></div>
      </div>

      <div className="section-heading">
        <div>
          <p className="eyebrow">Your projects</p>
          <h2>Recent projects</h2>
        </div>
        <span className="muted">Open a project to review feedback or preview the client view.</span>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">+</div>
          <h3>No projects yet</h3>
          <p>Create your first project and start a client review. You can test the whole workflow in this browser.</p>
          <button className="button button-primary" onClick={onNew}>Create your first project</button>
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((project) => {
            const pending = project.comments.filter((comment) => comment.status === 'open').length
            const resolved = project.comments.filter((comment) => comment.status === 'resolved').length
            const statusLabel = project.status === 'approved' ? 'Approved' : 'In review'
            return (
              <button key={project.id} className="project-card" onClick={() => onOpen(project.id)}>
                <div className="project-topline">
                  <span className={project.status === 'approved' ? 'pill success' : 'pill'}>{statusLabel}</span>
                  <span className="muted">Version {project.version}</span>
                </div>
                <div className="project-title">{project.title}</div>
                <div className="project-client">Client: {project.client}</div>
                <div className="project-meta">
                  <span>{pending} open · {resolved} resolved</span>
                  <span>{relativeDate(project.createdAt)}</span>
                </div>
                <div className="project-card-action">Open review <span aria-hidden="true">→</span></div>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
