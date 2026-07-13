import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useAuth } from '../../context/AuthContext'

/** Gates a route behind Firebase auth, and behind the one-time username
 * onboarding step. Renders a centered spinner while the initial auth check
 * is still in flight. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { firebaseUser, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />
  }

  if (profile && !profile.username && location.pathname !== '/onboarding/username') {
    return <Navigate to="/onboarding/username" replace />
  }

  return <>{children}</>
}
