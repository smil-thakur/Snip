import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  TextField,
  Typography,
  Divider,
  Alert,
  Tabs,
  Tab,
  Stack,
  CircularProgress,
} from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import { Logo } from '../components/logo/Logo'
import { useAuth } from '../context/AuthContext'
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../firebase/auth'
import { isFirebaseAuthError, describeAuthError } from '../utils/authErrors'

type Mode = 'signin' | 'signup'

/** Public entry point: Google or email/password auth. Firebase handles the
 * credential exchange directly; AuthProvider picks up the resulting session
 * and syncs a backend profile automatically. */
export function LoginPage() {
  const { firebaseUser, loading } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!loading && firebaseUser) {
    return <Navigate to="/" replace />
  }

  const handleGoogle = async () => {
    setError(null)
    setSubmitting(true)
    try {
      await signInWithGoogle()
      navigate('/', { replace: true })
    } catch (err) {
      setError(isFirebaseAuthError(err) ? describeAuthError(err) : 'Could not sign in with Google.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, name)
      } else {
        await signInWithEmail(email, password)
      }
      navigate('/', { replace: true })
    } catch (err) {
      setError(isFirebaseAuthError(err) ? describeAuthError(err) : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 380 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Logo size="large" />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
          Short, focused notes on what you're learning.
        </Typography>

        <Tabs
          value={mode}
          onChange={(_, value: Mode) => setMode(value)}
          variant="fullWidth"
          sx={{ mb: 3, minHeight: 36 }}
        >
          <Tab value="signin" label="Sign in" sx={{ minHeight: 36 }} />
          <Tab value="signup" label="Create account" sx={{ minHeight: 36 }} />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          fullWidth
          variant="outlined"
          startIcon={<GoogleIcon />}
          onClick={handleGoogle}
          disabled={submitting}
          sx={{ mb: 2, py: 1 }}
        >
          Continue with Google
        </Button>

        <Divider sx={{ my: 2 }}>
          <Typography variant="caption" color="text.secondary">
            or
          </Typography>
        </Divider>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {mode === 'signup' && (
              <TextField
                label="Display name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                required
                size="small"
              />
            )}
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              size="small"
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              size="small"
              slotProps={{ htmlInput: { minLength: 6 } }}
            />
            <Button type="submit" variant="contained" fullWidth disabled={submitting} sx={{ py: 1 }}>
              {submitting ? <CircularProgress size={20} color="inherit" /> : mode === 'signup' ? 'Create account' : 'Sign in'}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}
