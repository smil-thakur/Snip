import axios from 'axios'
import { firebaseAuth } from '../firebase/config'

/** Axios instance for the Go backend. A request interceptor attaches the
 * current Firebase ID token so every call is authenticated. */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

apiClient.interceptors.request.use(async (requestConfig) => {
  const currentUser = firebaseAuth.currentUser
  if (currentUser) {
    const token = await currentUser.getIdToken()
    requestConfig.headers.Authorization = `Bearer ${token}`
  }
  return requestConfig
})
