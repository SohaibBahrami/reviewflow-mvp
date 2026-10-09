import type { Project } from '../lib/types'
import { relativeDate } from '../lib/format'
import { getDashboardProjectGroups } from '../lib/projectRules'
import { useI18n } from '../lib/i18n'

type Props = {
  projects: Project[]
  onNew: () => void
  onOpen: (id: string) => void
  onToggleComplete: (id: string) => void
}

function ProjectCard({ project, onOpen, onToggleComplete }: {
  project: Project
  onOpen: (id: string) => void
  onToggleComplete: (id: string) => void
}) {
  const { t, locale } = useI18n()
  const pending = project.comments.filter((comment) => comment.status === 'open').length
  const resolved = project.comments.filter((comment) => comment.status === 'resolved').length
  const statusLabel = project.status === 'completed'
    ? t('Completed')
    : project.status === 'approved'
      ? t('Approved')
      : t('In review')

  return (
    <article className="project-card">
      <button className="project-card-button" onClick={() => onOpen(project.id)} aria-label={t('Open {title}', { title: project.title })}>
        <div className="project-topline">
          <span className={project.status === 'approved' ? 'pill success' : project.status === 'completed' ? 'pill completed' : 'pill'}>{statusLabel}</span>
          <span className="muted">{t('Version {version}', { version: project.version })}</span>
        </div>
        <div className="project-title">{project.title}</div>
        <div className="project-client">{t('Client: {client}', { client: project.client })}</div>
        <div className="project-meta">
          <span>{t('{pending} open · {resolved} resolved', { pending, resolved })}</span>
          <span>{relativeDate(project.completedAt ?? project.createdAt, locale)}</span>
        </div>
        <div className="project-card-action">{t('Open review')} <span aria-hidden="true">→</span></div>
      </button>
      <div className="project-card-actions">
        <button className="button button-secondary" onClick={() => onToggleComplete(project.id)}>
          {project.status === 'completed' ? t('Reopen project') : t('Mark complete')}
        </button>
      </div>
    </article>
  )
}

export function Dashboard({ projects, onNew, onOpen, onToggleComplete }: Props) {
  const { t } = useI18n()
  const { active: activeProjects, completed: completedProjects } = getDashboardProjectGroups(projects)
  const activeCount = activeProjects.length
  const openComments = activeProjects.reduce(
    (sum, project) => sum + project.comments.filter((comment) => comment.status === 'open').length,
    0,
  )
  const approvedCount = activeProjects.filter((project) => project.status === 'approved').length

  return (
    <section>
      <div className="hero-row">
        <div>
          <p className="eyebrow">{t('Projects')}</p>
          <h1>{t('Keep every client review in one place.')}</h1>
          <p className="hero-copy">{t('Create a project, upload a cut, send your client a review link, and keep every comment tied to the video.')}</p>
        </div>
        <button className="button button-primary" onClick={onNew}>{t('Create project')}</button>
      </div>

      <div className="stat-grid" aria-label={t('Project summary')}>
        <div className="stat-card"><span>{t('Active projects')}</span><strong>{activeCount}</strong></div>
        <div className="stat-card"><span>{t('Open feedback')}</span><strong>{openComments}</strong></div>
        <div className="stat-card"><span>{t('Approved versions')}</span><strong>{approvedCount}</strong></div>
      </div>

      <div className="project-sections">
        <div>
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t('Active work')}</p>
              <h2>{t('Projects to review')}</h2>
            </div>
            <span className="muted">{t('Open a project to review feedback or preview the client view.')}</span>
          </div>
          {activeProjects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" aria-hidden="true">+</div>
              <h3>{t('No active projects')}</h3>
              <p>{t('Create a project to start your next client review.')}</p>
              <button className="button button-primary" onClick={onNew}>{t('Create project')}</button>
            </div>
          ) : (
            <div className="project-grid">
              {activeProjects.map((project) => <ProjectCard key={project.id} project={project} onOpen={onOpen} onToggleComplete={onToggleComplete} />)}
            </div>
          )}
        </div>

        {completedProjects.length > 0 && (
          <div className="completed-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{t('Archive')}</p>
                <h2>{t('Completed projects')}</h2>
              </div>
              <span className="muted">{t('Completed work stays here, separate from projects that still need attention.')}</span>
            </div>
            <div className="project-grid">
              {completedProjects.map((project) => <ProjectCard key={project.id} project={project} onOpen={onOpen} onToggleComplete={onToggleComplete} />)}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
