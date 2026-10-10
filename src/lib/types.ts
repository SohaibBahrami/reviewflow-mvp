export type CommentStatus = 'open' | 'resolved'

export interface ReviewComment {
  id: string
  timestamp: number
  text: string
  author: string
  createdAt: string
  status: CommentStatus
}

export interface ProjectVersionSnapshot {
  version: number
  status: 'in_review' | 'approved' | 'completed'
  archivedAt: string
  localVideoId?: string
  localVideoName?: string
  comments: ReviewComment[]
}

export interface Project {
  id: string
  title: string
  client: string
  status: 'in_review' | 'approved' | 'completed' | 'trashed'
  completedAt?: string
  trashedAt?: string
  statusBeforeTrash?: 'in_review' | 'approved' | 'completed'
  version: number
  createdAt: string
  shareToken: string
  localVideoId?: string
  localVideoName?: string
  localVideoUrl?: string
  comments: ReviewComment[]
  versionHistory: ProjectVersionSnapshot[]
}
