import { apiClient } from './client'

export async function likeSnip(id: string): Promise<void> {
  await apiClient.post(`/snips/${id}/like`)
}

export async function unlikeSnip(id: string): Promise<void> {
  await apiClient.delete(`/snips/${id}/like`)
}
