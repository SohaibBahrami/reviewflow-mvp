export const MAX_TRASH_PROJECTS = 3

export function countTrashedProjects(projects) {
  return projects.filter((project) => project.status === 'trashed').length
}

export function canMoveProjectToTrash(projects, id) {
  const project = projects.find((item) => item.id === id)
  if (!project || project.status === 'trashed') return false
  return countTrashedProjects(projects) < MAX_TRASH_PROJECTS
}

export function getProjectValidationError(title, client, hasVideo) {
  if (!title.trim() && !client.trim()) {
    return 'Enter a project name and client name before creating the project.'
  }
  if (!title.trim()) return 'Enter a project name before creating the project.'
  if (!client.trim()) return 'Enter a client name before creating the project.'
  if (!hasVideo) return 'Select a video file before creating the project.'
  return null
}

export function getDashboardProjectGroups(projects) {
  return {
    active: projects.filter((project) => project.status !== 'completed' && project.status !== 'trashed'),
    completed: projects.filter((project) => project.status === 'completed'),
  }
}
