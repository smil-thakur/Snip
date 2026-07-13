import { useState } from 'react'
import { IconButton, Stack, Typography } from '@mui/material'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded'
import { likeSnip, unlikeSnip } from '../../api/likeApi'

interface LikeButtonProps {
  snipId: string
  initialLiked: boolean
  initialCount: number
}

/** Optimistic like/unlike toggle. Reverts on request failure. */
export function LikeButton({ snipId, initialLiked, initialCount }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [busy, setBusy] = useState(false)

  const toggle = async () => {
    if (busy) return
    setBusy(true)
    const wasLiked = liked
    setLiked(!wasLiked)
    setCount((c) => (wasLiked ? c - 1 : c + 1))
    try {
      if (wasLiked) {
        await unlikeSnip(snipId)
      } else {
        await likeSnip(snipId)
      }
    } catch {
      setLiked(wasLiked)
      setCount((c) => (wasLiked ? c + 1 : c - 1))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
      <IconButton size="small" onClick={toggle} aria-label={liked ? 'Unlike' : 'Like'} color={liked ? 'error' : 'default'}>
        {liked ? <FavoriteRoundedIcon fontSize="small" /> : <FavoriteBorderRoundedIcon fontSize="small" />}
      </IconButton>
      <Typography variant="body2" color="text.secondary">
        {count}
      </Typography>
    </Stack>
  )
}
