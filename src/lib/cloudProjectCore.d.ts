import type { Project } from './types'

export function isUuid(value: unknown): value is string
export function normalizeProjectForCloud(project: Project, createId?: () => string): Project
export function projectToCloudPayload(project: Project): Record<string, unknown>
export function projectPayloadSignature(project: Project): string
export function cloudRowToProject(row: Record<string, any>, localProject?: Project | null): Project
