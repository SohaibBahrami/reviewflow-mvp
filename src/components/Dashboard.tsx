import type { Project } from '../lib/types'
import { relativeDate } from '../lib/format'

type Props = {
  projects: Project[]
  onNew: () => void
  onOpen: (id: string) => void
  onDelete: (id: string) => void
  onToggleComplete: (id: string) => void
}

function ProjectCard({ project, onOpen, onDelete, onToggleComplete }: {
  project: Project
  onOpen: (id: string) => void
  onDelete: (id: string) => void
  onToggleComplete: (id: string) => void
}) {
  const pending = project.comments.filter((comment) => comment.status === 'open').length
  const resolved = project.comments.filter((comment) => comment.status === 'resolved').length
  const statusLabel = project.status === 'completed'
    ? 'Completed'
    : project.status === 'approved'
      ? 'Approved'
      : 'In review'

  return (
    <article className="project-card">
      <button className="project-card-button" onClick={() => onOpen(project.id)} aria-label={`Open ${project.title}`}>
        <div className="project-topline">
          <span className={project.status === 'approved' ? 'pill success' : project.status === 'completed' ? 'pill completed' : 'pill'}>{statusLabel}</span>
          <span className="muted">Version {project.version}</span>
        </div>
        <div className="project-title">{project.title}</div>
        <div className="project-client">Client: {project.client}</div>
        <div className="project-meta">
          <span>{pending} open · {resolved} resolved</span>
          <span>{relativeDate(project.completedAt ?? project.createdAt)}</span>
        </div>
        <div className="project-card-action">Open review <span aria-hidden="true">→</span></div>
      </button>
      <div className="project-card-actions">
        <button className="button button-secondary" onClick={() => onToggleComplete(project.id)}>
          {project.status === 'completed' ? 'Reopen project' : 'Mark complete'}
        </button>
        <button className="button button-danger" onClick={() => onDelete(project.id)}>Delete</button>
      </div>
    </article>
  )
}

export function Dashboard({ projects, onNew, onOpen, onDelete, onToggleComplete }: Props) {
  const activeProjects = projects.filter((p) => p.status !== 'completed')
  const completedProjects = projects.filter((p) => p.status === 'completed')
  const activeCount = activeProjects.length
  const openComments = activeProjects.reduce(
    (sum, project) => sum + project.comments.filter((comment) => comment.status === 'open').length,
    0,
  )
  const approvedCount = activeProjects.filter((p) => p.status === 'approved').length

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
        <div className="stat-card"><span>Active projects</span><strong>{activeCount}</strong></div>
        <div className="stat-card"><span>Open feedback</span><strong>{openComments}</strong></div>
        <div className="stat-card"><span>Approved versions</span><strong>{approvedCount}</strong></div>
      </div>

      <div className="project-sections">
        <div>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Active work</p>
              <h2>Projects to review</h2>
            </div>
            <span className="muted">Open a project to review feedback or preview the client view.</span>
          </div>

          {activeProjects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" aria-hidden="true">+</div>
              <h3>No active projects</h3>
              <p>Create a project to start your next client review.</p>
              <button className="button button-primary" onClick={onNew}>Create project</button>
            </div>
          ) : (
            <div className="project-grid">
              {activeProjects.map((project) => (
                <ProjectCard key={project.id} project={project} onOpen={onOpen} onDelete={onDelete} onToggleComplete={onToggleComplete} />
              ))}
            </div>
          )}
        </div>

        {completedProjects.length > 0 && (
          <div className="completed-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Archive</p>
                <h2>Completed projects</h2>
              </div>
              <span className="muted">Completed work stays here, separate from projects that still need attention.</span>
            </div>
            <div className="project-grid">
              {completedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} onOpen={onOpen} onDelete={onDelete} onToggleComplete={onToggleComplete} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
