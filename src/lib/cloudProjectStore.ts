import type { SupabaseClient } from '@supabase/supabase-js'
import type { Project } from './types'
import { projectToCloudPayload } from './cloudProjectCore.js'

export type CloudProjectRow = Record<string, any> & { id: string }

const PROJECT_SELECT = `
  id,
  title,
  client_name,
  status,
  current_version,
  share_token,
  status_before_trash,
  created_at,
  completed_at,
  trashed_at,
  project_versions (
    version_number,
    status,
    video_provider,
    video_asset_id,
    created_at,
    approved_at,
    review_comments (
      id,
      timestamp_seconds,
      body,
      author_name,
      status,
      created_at
    )
  )
`

export async function loadCloudProjects(client: SupabaseClient, ownerId: string): Promise<CloudProjectRow[]> {
  const { data, error } = await client
    .from('projects')
    .select(PROJECT_SELECT)
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as CloudProjectRow[]
}

export async function saveCloudProject(client: SupabaseClient, project: Project): Promise<void> {
  const { error } = await client.rpc('sync_reviewflow_project', {
    project_data: projectToCloudPayload(project),
  })

  if (error) throw error
}
