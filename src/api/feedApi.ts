import { apiClient } from './client'
import type { SnipPage } from '../types'

export type DiscoverSort = 'recent' | 'top'

export async function getHomeFeed(cursor?: string): Promise<SnipPage> {
  const res = await apiClient.get<{ data: SnipPage }>('/feed/home', { params: { cursor } })
  return res.data.data
}

export async function getDiscoverFeed(sort: DiscoverSort = 'recent', cursor?: string): Promise<SnipPage> {
  const res = await apiClient.get<{ data: SnipPage }>('/feed/discover', { params: { sort, cursor } })
  return res.data.data
}

export async function getFollowingFeed(cursor?: string): Promise<SnipPage> {
  const res = await apiClient.get<{ data: SnipPage }>('/feed/following', { params: { cursor } })
  return res.data.data
}
