import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { SnipCard } from '../components/snip/SnipCard'
import { FollowButton } from '../components/social/FollowButton'
import { useAuth } from '../context/AuthContext'
import { getByUsername, updateMe } from '../api/userApi'
import { listByAuthor } from '../api/snipApi'
import type { Snip, UserProfile } from '../types'

/** A user's public profile: header (avatar, bio, counts, follow/edit
 * action) plus their published snips. */
export function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const { profile: myProfile, refreshProfile } = useAuth()

  const [user, setUser] = useState<UserProfile | null>(null)
  const [snips, setSnips] = useState<Snip[]>([])
  const [snipsLoading, setSnipsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const isOwnProfile = myProfile?.username === username

  const load = useCallback(async () => {
    if (!username) return
    setNotFound(false)
    setSnipsLoading(true)
    let resolvedUser: UserProfile
    try {
      resolvedUser = await getByUsername(username)
    } catch {
      setNotFound(true)
      setSnipsLoading(false)
      return
    }
    setUser(resolvedUser)

    try {
      const snipPage = await listByAuthor(username)
      setSnips(snipPage.snips ?? [])
    } catch {
      setSnips([])
    } finally {
      setSnipsLoading(false)
    }
  }, [username])

  useEffect(() => {
    void load()
  }, [load])

  if (notFound) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
        This account doesn't exist.
      </Typography>
    )
  }

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    )
  }

  return (
    <Box>
      <Stack direction="row" spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 2 }}>
        <Avatar src={user.photoUrl} sx={{ width: { xs: 56, sm: 72 }, height: { xs: 56, sm: 72 }, flexShrink: 0 }}>
          {user.displayName?.[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 1, sm: 0 }}
            sx={{ alignItems: { xs: 'flex-start', sm: 'flex-start' }, justifyContent: 'space-between' }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
                {user.displayName}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                @{user.username}
              </Typography>
            </Box>
            {isOwnProfile ? (
              <Button size="small" variant="outlined" onClick={() => setEditOpen(true)}>
                Edit profile
              </Button>
            ) : (
              <FollowButton key={user.uid} username={user.username} initialFollowing={user.isFollowedByMe} />
            )}
          </Stack>
          {user.bio && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {user.bio}
            </Typography>
          )}
          <Stack direction="row" spacing={2} sx={{ mt: 1.5, flexWrap: 'wrap', rowGap: 0.5 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ cursor: 'pointer' }}
              onClick={() => navigate(`/${user.username}/following`)}
            >
              <strong>{user.followingCount}</strong> Following
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ cursor: 'pointer' }}
              onClick={() => navigate(`/${user.username}/followers`)}
            >
              <strong>{user.followersCount}</strong> Followers
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>{user.snipsCount}</strong> Snips
            </Typography>
          </Stack>
        </Box>
      </Stack>

      {snipsLoading ? (
        <SnipCardSkeletonList />
      ) : snips.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No snips yet.
        </Typography>
      ) : (
        snips.map((snip) => (
          <SnipCard
            key={snip.id}
            snip={snip}
            onDeleted={(id) => setSnips((prev) => prev.filter((s) => s.id !== id))}
            onUpdated={(updated) => setSnips((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))}
          />
        ))
      )}

      {isOwnProfile && (
        <EditProfileDialog
          open={editOpen}
          user={user}
          onClose={() => setEditOpen(false)}
          onSaved={async (updated) => {
            setUser(updated)
            setEditOpen(false)
            await refreshProfile()
          }}
        />
      )}
    </Box>
  )
}

/** Placeholder shapes matching SnipCard's rough layout, shown while a
 * profile's snips are still loading — an empty snips array during that
 * window isn't yet known to mean "no snips," so it shouldn't render as
 * the empty state. */
function SnipCardSkeletonList() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <Paper key={i} variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Skeleton variant="circular" width={28} height={28} />
            <Skeleton variant="text" width={100} />
            <Skeleton variant="text" width={70} />
          </Stack>
          <Skeleton variant="text" sx={{ mt: 1 }} />
          <Skeleton variant="text" width="80%" />
        </Paper>
      ))}
    </>
  )
}

function EditProfileDialog({
  open,
  user,
  onClose,
  onSaved,
}: {
  open: boolean
  user: UserProfile
  onClose: () => void
  onSaved: (user: UserProfile) => void
}) {
  const [displayName, setDisplayName] = useState(user.displayName)
  const [bio, setBio] = useState(user.bio)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await updateMe({ displayName, bio })
      onSaved(updated)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Edit profile</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label="Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            size="small"
            fullWidth
            multiline
            minRows={2}
            slotProps={{ htmlInput: { maxLength: 160 } }}
            helperText={`${bio.length}/160`}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={18} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
