import { apiClient } from './client'
import type { UserPage } from '../types'

export async function followUser(username: string): Promise<void> {
  await apiClient.post(`/users/${username}/follow`)
}

export async function unfollowUser(username: string): Promise<void> {
  await apiClient.delete(`/users/${username}/follow`)
}

export async function listFollowers(username: string, cursor?: string): Promise<UserPage> {
  const res = await apiClient.get<{ data: UserPage }>(`/users/${username}/followers`, {
    params: { cursor },
  })
  return res.data.data
}

export async function listFollowing(username: string, cursor?: string): Promise<UserPage> {
  const res = await apiClient.get<{ data: UserPage }>(`/users/${username}/following`, {
    params: { cursor },
  })
  return res.data.data
}
