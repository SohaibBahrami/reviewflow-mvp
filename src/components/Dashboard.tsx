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

  return (
    <section>
      <div className="hero-row">
        <div>
          <p className="eyebrow">Your review desk</p>
          <h1>Get feedback without the 14-message WhatsApp thread.</h1>
          <p className="hero-copy">
            Upload a cut, send one clean link, collect timestamped comments, and get a clear approval.
          </p>
        </div>
        <button className="button button-primary" onClick={onNew}>+ New project</button>
      </div>

      <div className="stat-grid">
        <div className="stat-card"><span>Active reviews</span><strong>{activeCount}</strong></div>
        <div className="stat-card"><span>Open comments</span><strong>{openComments}</strong></div>
        <div className="stat-card"><span>Approved</span><strong>{projects.filter((p) => p.status === 'approved').length}</strong></div>
      </div>

      <div className="section-heading">
        <div>
          <p className="eyebrow">Projects</p>
          <h2>Recent work</h2>
        </div>
        <span className="muted">Local prototype — nothing leaves your device</span>
      </div>

      <div className="project-grid">
        {projects.map((project) => {
          const pending = project.comments.filter((comment) => comment.status === 'open').length
          return (
            <button key={project.id} className="project-card" onClick={() => onOpen(project.id)}>
              <div className="project-topline">
                <span className={project.status === 'approved' ? 'pill success' : 'pill'}>
                  {project.status === 'approved' ? 'Approved' : 'In review'}
                </span>
                <span className="muted">v{project.version}</span>
              </div>
              <div className="project-title">{project.title}</div>
              <div className="project-client">{project.client}</div>
              <div className="project-meta">
                <span>{pending} open comment{pending === 1 ? '' : 's'}</span>
                <span>{relativeDate(project.createdAt)}</span>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
