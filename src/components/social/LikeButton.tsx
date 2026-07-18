import { useState } from 'react'
import { IconButton, Stack, Typography } from '@mui/material'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded'
import { likeSnip, unlikeSnip } from '../../api/likeApi'

interface LikeButtonProps {
  snipId: string
  initialLiked: boolean
  initialCount: number
  /** 'row' (default) for the inline SnipCard layout; 'column' stacks the
   * icon above the count, for the Instagram-style vertical action rail in
   * ScrollPage. */
  direction?: 'row' | 'column'
  /** Larger touch target + icon for the full-screen reel view. */
  size?: 'small' | 'large'
  /** Icon/count color — defaults to theme colors, but the reel view sits
   * over media and needs to force white regardless of light/dark mode. */
  color?: string
}

/** Optimistic like/unlike toggle. Reverts on request failure. */
export function LikeButton({ snipId, initialLiked, initialCount, direction = 'row', size = 'small', color }: LikeButtonProps) {
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

  const iconFontSize = size === 'large' ? 'inherit' : 'small'

  return (
    <Stack direction={direction} spacing={direction === 'column' ? 0 : 0.5} sx={{ alignItems: 'center' }}>
      <IconButton
        size={size}
        onClick={toggle}
        aria-label={liked ? 'Unlike' : 'Like'}
        sx={{ color: color ?? (liked ? 'error.main' : undefined), fontSize: size === 'large' ? 32 : undefined }}
      >
        {liked ? <FavoriteRoundedIcon fontSize={iconFontSize} /> : <FavoriteBorderRoundedIcon fontSize={iconFontSize} />}
      </IconButton>
      <Typography variant="body2" sx={{ color: color ?? 'text.secondary', fontWeight: direction === 'column' ? 600 : 400 }}>
        {count}
      </Typography>
    </Stack>
  )
}
