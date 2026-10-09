import { relativeDate } from '../lib/format'
import type { Project } from '../lib/types'
import { MAX_TRASH_PROJECTS } from '../lib/projectRules'
import { useI18n } from '../lib/i18n'

type Props = {
  projects: Project[]
  onBack: () => void
  onRestore: (id: string) => void
  onDeletePermanently: (id: string) => void
}

export function Trash({ projects, onBack, onRestore, onDeletePermanently }: Props) {
  const { t, locale } = useI18n()
  const trashed = projects
    .filter((project) => project.status === 'trashed')
    .sort((a, b) => new Date(b.trashedAt ?? 0).getTime() - new Date(a.trashedAt ?? 0).getTime())

  return (
    <section>
      <div className="hero-row">
        <div>
          <button className="back-link" onClick={onBack}>← {t('Back to projects')}</button>
          <p className="eyebrow">{t('Trash')}</p>
          <h1>{t('Deleted projects stay here for now.')}</h1>
          <p className="hero-copy">{t('Restore a project when you changed your mind, or permanently delete it when you are certain you no longer need it.')}</p>
        </div>
        <p className="muted">{t('{count} of {max} Trash slots used. Restore a project or delete one forever to make room for another.', { count: trashed.length, max: MAX_TRASH_PROJECTS })}</p>
      </div>

      {trashed.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">⌫</div>
          <h3>{t('Trash is empty')}</h3>
          <p>{t('Projects you delete will appear here until you permanently remove them.')}</p>
        </div>
      ) : (
        <div className="project-grid">
          {trashed.map((project) => (
            <article key={project.id} className="project-card trashed-card">
              <div className="project-topline">
                <span className="pill trashed">{t('In trash')}</span>
                <span className="muted">{relativeDate(project.trashedAt ?? project.createdAt, locale)}</span>
              </div>
              <div className="project-title">{project.title}</div>
              <div className="project-client">{t('Client: {client}', { client: project.client })}</div>
              <div className="project-meta">
                <span>{t('Version {version}', { version: project.version })}</span>
                <span>{t('Original state: {status}', { status: project.statusBeforeTrash === 'completed' ? t('Completed') : project.statusBeforeTrash === 'approved' ? t('Approved') : t('In review') })}</span>
              </div>
              <div className="project-card-actions">
                <button className="button button-secondary" onClick={() => onRestore(project.id)}>{t('Restore project')}</button>
                <button className="button button-danger" onClick={() => onDeletePermanently(project.id)}>{t('Delete forever')}</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
