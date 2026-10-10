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


export function startNextVersion(project, replacementVideo, archivedAt = new Date().toISOString()) {
  if (!replacementVideo?.localVideoId || !replacementVideo?.localVideoName) {
    throw new Error('A replacement video is required to start a new version.')
  }

  const previousStatus = project.status === 'trashed'
    ? (project.statusBeforeTrash || 'in_review')
    : project.status
  const snapshot = {
    version: project.version,
    status: previousStatus,
    archivedAt,
    localVideoId: project.localVideoId,
    localVideoName: project.localVideoName,
    comments: Array.isArray(project.comments) ? [...project.comments] : [],
  }
  const versionHistory = Array.isArray(project.versionHistory) ? project.versionHistory : []

  return {
    ...project,
    version: project.version + 1,
    status: 'in_review',
    completedAt: undefined,
    localVideoId: replacementVideo.localVideoId,
    localVideoName: replacementVideo.localVideoName,
    localVideoUrl: undefined,
    comments: [],
    versionHistory: [...versionHistory, snapshot],
  }
}

export function getProjectVideoIds(project) {
  const ids = []
  if (typeof project?.localVideoId === 'string' && project.localVideoId) ids.push(project.localVideoId)
  const history = Array.isArray(project?.versionHistory) ? project.versionHistory : []
  for (const version of history) {
    if (typeof version?.localVideoId === 'string' && version.localVideoId) ids.push(version.localVideoId)
  }
  return [...new Set(ids)]
}
