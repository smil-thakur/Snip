import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material'
import axios from 'axios'
import { Logo } from '../components/logo/Logo'
import { useAuth } from '../context/AuthContext'
import { updateMe } from '../api/userApi'

const USERNAME_PATTERN = /^[a-zA-Z0-9]{3,20}$/

/** One-time step for new accounts: claim a unique username before entering
 * the app. ProtectedRoute redirects here whenever profile.username is
 * empty. */
export function OnboardingUsernamePage() {
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!USERNAME_PATTERN.test(username)) {
      setError('Username must be 3-20 letters or numbers, no spaces or symbols.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await updateMe({ username })
      await refreshProfile()
      navigate('/', { replace: true })
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setError('That username is already taken.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
      <Box sx={{ width: '100%', maxWidth: 380 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Logo size="large" />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, textAlign: 'center', mb: 1 }}>
          Welcome{profile?.displayName ? `, ${profile.displayName}` : ''}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
          Choose a username to finish setting up your account.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
            fullWidth
            required
            size="small"
            autoFocus
            sx={{ mb: 2 }}
            helperText="3-20 letters or numbers"
          />
          <Button type="submit" variant="contained" fullWidth disabled={submitting} sx={{ py: 1 }}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Continue'}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
