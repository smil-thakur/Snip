import { apiClient } from './client'
import type { Comment } from '../types'

export interface CreateCommentRequest {
  parentId?: string
  text: string
}

export async function listComments(snipId: string): Promise<Comment[]> {
  const res = await apiClient.get<{ data: { comments: Comment[] } }>(`/snips/${snipId}/comments`)
  return res.data.data.comments
}

export async function createComment(snipId: string, req: CreateCommentRequest): Promise<Comment> {
  const res = await apiClient.post<{ data: Comment }>(`/snips/${snipId}/comments`, req)
  return res.data.data
}

export async function deleteComment(commentId: string): Promise<void> {
  await apiClient.delete(`/comments/${commentId}`)
}
