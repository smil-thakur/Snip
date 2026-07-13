import { apiClient } from './client'
import type { Snip, SnipPage } from '../types'

export interface CreateSnipRequest {
  contentDelta: unknown
  contentHtml: string
  contentText: string
  tags?: string[]
}

export async function createSnip(req: CreateSnipRequest): Promise<Snip> {
  const res = await apiClient.post<{ data: Snip }>('/snips', req)
  return res.data.data
}

export async function getSnip(id: string): Promise<Snip> {
  const res = await apiClient.get<{ data: Snip }>(`/snips/${id}`)
  return res.data.data
}

export interface UpdateSnipRequest {
  contentDelta: unknown
  contentHtml: string
  contentText: string
  tags?: string[]
}

export async function updateSnip(id: string, req: UpdateSnipRequest): Promise<Snip> {
  const res = await apiClient.patch<{ data: Snip }>(`/snips/${id}`, req)
  return res.data.data
}

export async function deleteSnip(id: string): Promise<void> {
  await apiClient.delete(`/snips/${id}`)
}

export async function listByAuthor(username: string, cursor?: string): Promise<SnipPage> {
  const res = await apiClient.get<{ data: SnipPage }>(`/users/${username}/snips`, {
    params: { cursor },
  })
  return res.data.data
}

export interface SearchSnipsParams {
  q?: string
  tags?: string[]
}

/** Searches by tags if any are given (they take priority), otherwise by a
 * free-text query — the backend can only apply one array-contains-any
 * filter per request, so combining both isn't supported. */
export async function searchSnips(params: SearchSnipsParams, cursor?: string): Promise<SnipPage> {
  const res = await apiClient.get<{ data: SnipPage }>('/search/snips', {
    params: {
      q: params.q || undefined,
      tags: params.tags && params.tags.length > 0 ? params.tags.join(',') : undefined,
      cursor,
    },
  })
  return res.data.data
}
