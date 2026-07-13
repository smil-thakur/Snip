import { useState } from 'react'
import { Button, CircularProgress } from '@mui/material'
import { followUser, unfollowUser } from '../../api/followApi'

interface FollowButtonProps {
  username: string
  initialFollowing: boolean
  onChange?: (following: boolean) => void
}

/** Optimistic follow/unfollow toggle for a profile header. */
export function FollowButton({ username, initialFollowing, onChange }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing)
  const [busy, setBusy] = useState(false)

  const toggle = async () => {
    if (busy) return
    setBusy(true)
    const was = following
    setFollowing(!was)
    onChange?.(!was)
    try {
      if (was) {
        await unfollowUser(username)
      } else {
        await followUser(username)
      }
    } catch {
      setFollowing(was)
      onChange?.(was)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      variant={following ? 'outlined' : 'contained'}
      size="small"
      onClick={toggle}
      disabled={busy}
      sx={{ minWidth: 96 }}
    >
      {busy ? <CircularProgress size={16} color="inherit" /> : following ? 'Following' : 'Follow'}
    </Button>
  )
}
