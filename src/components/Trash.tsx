import { relativeDate } from '../lib/format'
import type { Project } from '../lib/types'

type Props = {
  projects: Project[]
  onBack: () => void
  onRestore: (id: string) => void
  onDeletePermanently: (id: string) => void
}

export function Trash({ projects, onBack, onRestore, onDeletePermanently }: Props) {
  const trashed = projects
    .filter((project) => project.status === 'trashed')
    .sort((a, b) => new Date(b.trashedAt ?? 0).getTime() - new Date(a.trashedAt ?? 0).getTime())

  return (
    <section>
      <div className="hero-row">
        <div>
          <button className="back-link" onClick={onBack}>← Back to projects</button>
          <p className="eyebrow">Trash</p>
          <h1>Deleted projects stay here for now.</h1>
          <p className="hero-copy">Restore a project when you changed your mind, or permanently delete it when you are certain you no longer need it.</p>
        </div>
      </div>

      {trashed.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">⌫</div>
          <h3>Trash is empty</h3>
          <p>Projects you delete will appear here until you permanently remove them.</p>
        </div>
      ) : (
        <div className="project-grid">
          {trashed.map((project) => (
            <article key={project.id} className="project-card trashed-card">
              <div className="project-topline">
                <span className="pill trashed">In trash</span>
                <span className="muted">{relativeDate(project.trashedAt ?? project.createdAt)}</span>
              </div>
              <div className="project-title">{project.title}</div>
              <div className="project-client">Client: {project.client}</div>
              <div className="project-meta">
                <span>Version {project.version}</span>
                <span>Original state: {project.statusBeforeTrash === 'completed' ? 'Completed' : project.statusBeforeTrash === 'approved' ? 'Approved' : 'In review'}</span>
              </div>
              <div className="project-card-actions">
                <button className="button button-secondary" onClick={() => onRestore(project.id)}>Restore project</button>
                <button className="button button-danger" onClick={() => onDeletePermanently(project.id)}>Delete forever</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
