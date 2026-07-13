import { apiClient } from './client'
import { firebaseAuth } from '../firebase/config'
import type { SessionResult } from '../types'

/** Verifies the current Firebase session with the backend, creating a
 * Firestore profile on first login. Call right after signing in.
 *
 * Sends the live Firebase currentUser's displayName/photoURL because the ID
 * token's "name"/"picture" claims can briefly lag behind an updateProfile()
 * call (e.g. right after sign-up) until the token is next refreshed. */
export async function syncSession(): Promise<SessionResult> {
  const current = firebaseAuth.currentUser
  const res = await apiClient.post<{ data: SessionResult }>('/auth/session', {
    displayName: current?.displayName ?? '',
    photoUrl: current?.photoURL ?? '',
  })
  return res.data.data
}
