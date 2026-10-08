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
  status: 'in_review' | 'approved'
  version: number
  createdAt: string
  localVideoUrl?: string
  comments: ReviewComment[]
}
