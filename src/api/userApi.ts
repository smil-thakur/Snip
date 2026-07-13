import { apiClient } from './client'
import type { UserProfile } from '../types'

export interface UpdateProfileRequest {
  username?: string
  displayName?: string
  bio?: string
  photoUrl?: string
}

export async function getMe(): Promise<UserProfile> {
  const res = await apiClient.get<{ data: UserProfile }>('/users/me')
  return res.data.data
}

export async function updateMe(req: UpdateProfileRequest): Promise<UserProfile> {
  const res = await apiClient.patch<{ data: UserProfile }>('/users/me', req)
  return res.data.data
}

export async function getByUsername(username: string): Promise<UserProfile> {
  const res = await apiClient.get<{ data: UserProfile }>(`/users/${username}`)
  return res.data.data
}

export async function searchUsers(query: string): Promise<UserProfile[]> {
  const res = await apiClient.get<{ data: UserProfile[] }>('/search/users', { params: { q: query } })
  return res.data.data
}
