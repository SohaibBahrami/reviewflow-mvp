import type { Project } from './types'

const STORAGE_KEY = 'reviewflow-projects-v1'

const starterProject: Project = {
  id: 'demo-project',
  title: 'Launch video — v2',
  client: 'Northstar Coffee',
  status: 'in_review',
  version: 2,
  createdAt: new Date().toISOString(),
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

export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [starterProject]
    const parsed = JSON.parse(raw) as Project[]
    return Array.isArray(parsed) ? parsed : [starterProject]
  } catch {
    return [starterProject]
  }
}

export function saveProjects(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
}
