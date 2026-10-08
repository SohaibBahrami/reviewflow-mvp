export type CommentStatus = 'open' | 'resolved'

export interface ReviewComment {
  id: string
  timestamp: number
  text: string
  author: string
  createdAt: string
  status: CommentStatus
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
  localVideoUrl?: string
  comments: ReviewComment[]
}
