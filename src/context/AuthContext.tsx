import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { onAuthChange, signOutUser } from '../firebase/auth'
import { syncSession } from '../api/authApi'
import type { UserProfile } from '../types'

interface AuthContextValue {
  firebaseUser: User | null
  profile: UserProfile | null
  /** True while the initial Firebase auth check + backend session sync is
   * in flight. Routing should wait on this before deciding where to send
   * the user. */
  loading: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = async () => {
    const result = await syncSession()
    setProfile(result.profile)
  }

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setFirebaseUser(user)
      if (user) {
        try {
          await refreshProfile()
        } catch {
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSignOut = async () => {
    await signOutUser()
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ firebaseUser, profile, loading, refreshProfile, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
