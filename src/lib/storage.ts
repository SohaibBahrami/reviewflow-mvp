import type { Project } from './types'

const STORAGE_KEY = 'reviewflow-projects-v1'

const starterProject: Project = {
  id: 'demo-project',
  title: 'Launch video — v2',
  client: 'Northstar Coffee',
  status: 'in_review',
  version: 2,
  createdAt: new Date().toISOString(),
  shareToken: crypto.randomUUID(),
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

export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [starterProject]
    const parsed = JSON.parse(raw) as Partial<Project>[]
    if (!Array.isArray(parsed)) return [starterProject]
    return parsed.map((project) => ({
      ...project,
      shareToken: project.shareToken || crypto.randomUUID(),
      status: project.status || 'in_review',
      statusBeforeTrash: project.statusBeforeTrash || undefined,
      trashedAt: project.trashedAt || undefined,
    })) as Project[]
  } catch (error) {
    console.error('ReviewFlow project storage could not be loaded.', error)
    return [starterProject]
  }
}

export function saveProjects(projects: Project[]): StorageResult {
  try {
    // Object URLs are temporary browser-session references and cannot survive a reload.
    // Keep project metadata persistent without pretending the local video itself was saved here.
    const persistable = projects.map(({ localVideoUrl: _localVideoUrl, ...project }) => project)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable))
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
