import type { Project } from './types'

export const MAX_TRASH_PROJECTS: number

export function countTrashedProjects(projects: readonly Pick<Project, 'status'>[]): number

export function canMoveProjectToTrash(projects: readonly Project[], id: string): boolean

export function getProjectValidationError(title: string, client: string, hasVideo: boolean): string | null

export function startNextVersion(project: Project, archivedAt?: string): Project

export function getDashboardProjectGroups(projects: readonly Project[]): {
  active: Project[]
  completed: Project[]
}
