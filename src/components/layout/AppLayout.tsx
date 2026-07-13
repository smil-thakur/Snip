import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Container,
  Tooltip,
  Divider,
} from '@mui/material'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import ExploreRoundedIcon from '@mui/icons-material/ExploreRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import { Logo } from '../logo/Logo'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { useAuth } from '../../context/AuthContext'

/** Shell for every authenticated page: top bar with logo, primary nav,
 * theme toggle, and account menu. Page content renders centered in a
 * narrow reading column, similar to a feed timeline. */
export function AppLayout() {
  const navigate = useNavigate()
  const { mode, toggleMode } = useThemeMode()
  const { profile, signOut } = useAuth()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleSignOut = async () => {
    setAnchorEl(null)
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="transparent" sx={{ bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ maxWidth: 640, width: '100%', mx: 'auto', px: { xs: 1, sm: 2 }, gap: { xs: 0, sm: 0.5 } }}>
          <Box sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => navigate('/')}>
            <Logo size="small" />
          </Box>

          <Box sx={{ flex: 1 }} />

          <Tooltip title="Feed">
            <IconButton onClick={() => navigate('/')} aria-label="Feed" sx={{ p: { xs: 0.75, sm: 1 } }}>
              <HomeRoundedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Discover">
            <IconButton onClick={() => navigate('/discover')} aria-label="Discover" sx={{ p: { xs: 0.75, sm: 1 } }}>
              <ExploreRoundedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Profile">
            <IconButton
              onClick={() => profile && navigate(`/${profile.username}`)}
              aria-label="Profile"
              disabled={!profile?.username}
              sx={{ p: { xs: 0.75, sm: 1 } }}
            >
              <PersonRoundedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={mode === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}>
            <IconButton onClick={toggleMode} aria-label="Toggle theme" sx={{ p: { xs: 0.75, sm: 1 } }}>
              {mode === 'light' ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
            </IconButton>
          </Tooltip>

          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ ml: 0.5 }} aria-label="Account menu">
            <Avatar src={profile?.photoUrl} sx={{ width: 30, height: 30 }}>
              {profile?.displayName?.[0]?.toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem
              onClick={() => {
                setAnchorEl(null)
                if (profile) navigate(`/${profile.username}`)
              }}
            >
              View profile
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleSignOut}>
              <LogoutRoundedIcon fontSize="small" sx={{ mr: 1 }} />
              Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth={false} sx={{ maxWidth: 640, py: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 3 } }}>
        <Outlet />
      </Container>
    </Box>
  )
}
