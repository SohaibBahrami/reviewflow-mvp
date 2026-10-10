const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}

export function normalizeProjectForCloud(project, createId = () => crypto.randomUUID()) {
  const normalizeComment = (comment) => ({
    ...comment,
    id: isUuid(comment.id) ? comment.id : createId(),
  })

  const versionHistory = (Array.isArray(project.versionHistory) ? project.versionHistory : []).map((version) => ({
    ...version,
    comments: (Array.isArray(version.comments) ? version.comments : []).map(normalizeComment),
  }))

  return {
    ...project,
    id: isUuid(project.id) ? project.id : createId(),
    shareToken: isUuid(project.shareToken) ? project.shareToken : createId(),
    comments: (Array.isArray(project.comments) ? project.comments : []).map(normalizeComment),
    versionHistory,
  }
}

function versionStatus(projectStatus, statusBeforeTrash) {
  if (projectStatus === 'trashed') return statusBeforeTrash || 'in_review'
  return ['in_review', 'approved', 'completed'].includes(projectStatus) ? projectStatus : 'in_review'
}

function isoTimestamp(value) {
  if (!value) return null
  const timestamp = new Date(value)
  return Number.isNaN(timestamp.getTime()) ? null : timestamp.toISOString()
}

function toCloudComment(comment) {
  return {
    id: isUuid(comment.id) ? comment.id : undefined,
    timestamp_seconds: Math.round(Math.max(0, Number(comment.timestamp) || 0) * 1000) / 1000,
    body: String(comment.text ?? '').trim(),
    author_name: String(comment.author ?? '').trim() || 'You',
    status: comment.status === 'resolved' ? 'resolved' : 'open',
    created_at: isoTimestamp(comment.createdAt),
  }
}

function toCloudVersion(version, number, status, createdAt, comments) {
  return {
    version_number: number,
    status,
    video_provider: version?.cloudVideoProvider || null,
    video_asset_id: version?.cloudVideoId || null,
    created_at: createdAt,
    approved_at: status === 'approved' ? isoTimestamp(version?.approvedAt) : null,
    comments: comments.map(toCloudComment)
      .filter((comment) => comment.body.length > 0)
      .sort((a, b) => String(a.id ?? '').localeCompare(String(b.id ?? ''))),
  }
}

export function projectToCloudPayload(project) {
  const history = (Array.isArray(project.versionHistory) ? project.versionHistory : [])
    .map((version) => toCloudVersion(
      version,
      version.version,
      versionStatus(version.status),
      version.archivedAt || project.createdAt,
      Array.isArray(version.comments) ? version.comments : [],
    ))

  history.push(toCloudVersion(
    project,
    project.version,
    versionStatus(project.status, project.statusBeforeTrash),
    project.createdAt,
    Array.isArray(project.comments) ? project.comments : [],
  ))

  return {
    id: project.id,
    title: String(project.title ?? '').trim(),
    client_name: String(project.client ?? '').trim(),
    status: project.status,
    current_version: project.version,
    share_token: project.shareToken,
    status_before_trash: project.status === 'trashed' ? (project.statusBeforeTrash || 'in_review') : null,
    created_at: isoTimestamp(project.createdAt),
    completed_at: isoTimestamp(project.completedAt),
    trashed_at: isoTimestamp(project.trashedAt),
    versions: history.sort((a, b) => a.version_number - b.version_number),
  }
}

function commentsFromCloud(rows = []) {
  return rows.map((comment) => ({
    id: comment.id,
    timestamp: Number(comment.timestamp_seconds) || 0,
    text: comment.body,
    author: comment.author_name,
    createdAt: comment.created_at,
    status: comment.status === 'resolved' ? 'resolved' : 'open',
  }))
}

function localVersionFor(project, versionNumber) {
  if (!project) return undefined
  if (project.version === versionNumber) return project
  return (Array.isArray(project.versionHistory) ? project.versionHistory : [])
    .find((version) => version.version === versionNumber)
}

function localVideoFields(cloudVersion, localProject, versionNumber) {
  const localVersion = localVersionFor(localProject, versionNumber)
  const cloudVideoId = cloudVersion.video_asset_id || localVersion?.cloudVideoId
  const cloudVideoProvider = cloudVersion.video_provider || localVersion?.cloudVideoProvider
  const hasCloudVideo = Boolean(cloudVideoId)

  return {
    ...(hasCloudVideo ? { cloudVideoId, cloudVideoProvider } : {}),
    ...(!hasCloudVideo && localVersion?.localVideoId ? { localVideoId: localVersion.localVideoId } : {}),
    ...(!hasCloudVideo && localVersion?.localVideoName ? { localVideoName: localVersion.localVideoName } : {}),
    ...(!hasCloudVideo && localVersion?.localVideoUrl ? { localVideoUrl: localVersion.localVideoUrl } : {}),
  }
}

export function cloudRowToProject(row, localProject = null) {
  const remoteVersions = [...(Array.isArray(row.project_versions) ? row.project_versions : [])]
    .sort((a, b) => a.version_number - b.version_number)
  const currentNumber = Number(row.current_version) || 1
  const currentVersion = remoteVersions.find((version) => version.version_number === currentNumber)
  const snapshots = remoteVersions
    .filter((version) => version.version_number !== currentNumber)
    .map((version) => ({
      version: version.version_number,
      status: version.status,
      archivedAt: version.created_at,
      ...localVideoFields(version, localProject, version.version_number),
      comments: commentsFromCloud(version.review_comments),
    }))

  const currentLocalVersion = localVersionFor(localProject, currentNumber)
  const status = ['in_review', 'approved', 'completed', 'trashed'].includes(row.status) ? row.status : 'in_review'

  return {
    id: row.id,
    title: row.title,
    client: row.client_name,
    status,
    completedAt: row.completed_at || undefined,
    trashedAt: row.trashed_at || undefined,
    statusBeforeTrash: row.status_before_trash || undefined,
    version: currentNumber,
    createdAt: row.created_at,
    shareToken: row.share_token,
    ...localVideoFields(currentVersion || {}, localProject, currentNumber),
    localVideoUrl: currentVersion?.video_asset_id ? undefined : currentLocalVersion?.localVideoUrl,
    comments: currentVersion ? commentsFromCloud(currentVersion.review_comments) : (currentLocalVersion?.comments ?? []),
    versionHistory: snapshots,
  }
}
