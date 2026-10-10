import type { Project } from './types'

const STORAGE_KEY = 'reviewflow-projects-v1'
const LOCAL_DATA_OWNER_KEY = 'reviewflow-local-data-owner'
const CLOUD_BASELINE_PREFIX = 'reviewflow-cloud-baseline-v1:'

const starterProject: Project = {
  id: 'demo-project',
  title: 'Launch video — v2',
  client: 'Northstar Coffee',
  status: 'in_review',
  version: 2,
  createdAt: new Date().toISOString(),
  shareToken: crypto.randomUUID(),
  versionHistory: [],
  comments: [
    {
      id: 'comment-1',
      timestamp: 14,
      text: 'Can we make this opening a little faster?',
      author: 'Maya',
      createdAt: new Date().toISOString(),
      status: 'open',
    },
    {
      id: 'comment-2',
      timestamp: 72,
      text: 'Love this shot. Keep it.',
      author: 'Maya',
      createdAt: new Date().toISOString(),
      status: 'resolved',
    },
  ],
}

export type StorageResult = {
  ok: boolean
  message?: string
}

export function getUserProjectsStorageKey(userId: string): string {
  return `${STORAGE_KEY}:user:${userId}`
}

export function getLocalDataOwner(): string | null {
  try {
    return localStorage.getItem(LOCAL_DATA_OWNER_KEY)
  } catch {
    return null
  }
}

export function setLocalDataOwner(userId: string): void {
  try {
    if (!getLocalDataOwner()) localStorage.setItem(LOCAL_DATA_OWNER_KEY, userId)
  } catch (error) {
    console.warn('ReviewFlow could not remember the local project owner.', error)
  }
}

export function loadProjects(storageKey = STORAGE_KEY, useStarterProject = true): Project[] {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return useStarterProject ? [starterProject] : []
    const parsed = JSON.parse(raw) as Partial<Project>[]
    if (!Array.isArray(parsed)) return [starterProject]
    return parsed.map((project) => ({
      ...project,
      shareToken: project.shareToken || crypto.randomUUID(),
      status: project.status || 'in_review',
      statusBeforeTrash: project.statusBeforeTrash || undefined,
      trashedAt: project.trashedAt || undefined,
      versionHistory: Array.isArray(project.versionHistory) ? project.versionHistory : [],
    })) as Project[]
  } catch (error) {
    console.error('ReviewFlow project storage could not be loaded.', error)
    return [starterProject]
  }
}

export function saveProjects(projects: Project[], storageKey = STORAGE_KEY): StorageResult {
  try {
    // Object URLs are temporary browser-session references and cannot survive a reload.
    // Keep project metadata persistent without pretending the local video itself was saved here.
    const persistable = projects.map(({ localVideoUrl: _localVideoUrl, ...project }) => project)
    localStorage.setItem(storageKey, JSON.stringify(persistable))
    return { ok: true }
  } catch (error) {
    console.error('ReviewFlow project storage could not be saved.', error)
    return {
      ok: false,
      message: 'Your project changes could not be saved in this browser. Check available storage and try again.',
    }
  }
}

export function resetProjects(): StorageResult {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return { ok: true }
  } catch (error) {
    console.error('ReviewFlow project storage could not be reset.', error)
    return { ok: false, message: 'ReviewFlow could not reset local project data.' }
  }
}

export function loadCloudSyncBaseline(userId: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(`${CLOUD_BASELINE_PREFIX}${userId}`)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
    )
  } catch (error) {
    console.warn('ReviewFlow could not load the cloud sync baseline.', error)
    return {}
  }
}

export function saveCloudSyncBaseline(userId: string, baseline: Record<string, string>): StorageResult {
  try {
    localStorage.setItem(`${CLOUD_BASELINE_PREFIX}${userId}`, JSON.stringify(baseline))
    return { ok: true }
  } catch (error) {
    console.error('ReviewFlow could not save the cloud sync baseline.', error)
    return {
      ok: false,
      message: 'Cloud sync history could not be saved in this browser.',
    }
  }
}
