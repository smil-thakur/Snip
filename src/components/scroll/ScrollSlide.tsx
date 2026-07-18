import { memo, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Box, Chip, CircularProgress, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material'
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded'
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded'
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded'
import { LikeButton } from '../social/LikeButton'
import { ShareDialog } from '../snip/ShareDialog'
import { MediaCarousel } from '../common/MediaCarousel'
import { sanitizeSnipCaption, extractSnipMediaList, stripYoutubeLinksFromCaption } from '../../utils/sanitizeSnipHtml'
import type { Snip } from '../../types'

interface ScrollSlideProps {
  snip: Snip
  active: boolean
  /** True within a small window around the active slide. Slides outside
   * this window render a lightweight placeholder instead of mounting real
   * <video>/<img>/<iframe> elements — the queue grows without bound as the
   * viewer scrolls (it recycles a shuffled pool indefinitely), so without
   * this every video/image/iframe ever scrolled past stays mounted, which
   * bogs down the whole page (including things as simple as tapping Like). */
  isNearActive: boolean
  muted: boolean
  onToggleMute: () => void
  onOpenComments: (snip: Snip) => void
}

function ScrollSlideImpl({ snip, active, isNearActive, muted, onToggleMute, onOpenComments }: ScrollSlideProps) {
  const navigate = useNavigate()
  const [shareOpen, setShareOpen] = useState(false)

  const media = useMemo(() => extractSnipMediaList(snip.contentHtml), [snip.contentHtml])
  const caption = useMemo(() => {
    const raw = sanitizeSnipCaption(snip.contentHtml)
    return media.some((m) => m.type === 'youtube') ? stripYoutubeLinksFromCaption(raw) : raw
  }, [snip.contentHtml, media])
  const hasVideo = media.some((m) => m.type === 'video')

  const actionRail = (
    <Stack
      spacing={2.5}
      sx={{
        position: 'absolute',
        right: 12,
        bottom: 24,
        alignItems: 'center',
      }}
    >
      <LikeButton
        snipId={snip.id}
        initialLiked={snip.likedByMe}
        initialCount={snip.likeCount}
        direction="column"
        size="large"
        color={media.length > 0 ? '#fff' : undefined}
      />

      <Tooltip title="Comments" placement="left">
        <Stack sx={{ alignItems: 'center', cursor: 'pointer' }} onClick={() => onOpenComments(snip)}>
          <IconButton size="large" sx={{ color: media.length > 0 ? '#fff' : 'text.secondary', fontSize: 32 }} aria-label="View comments">
            <ChatBubbleOutlineRoundedIcon fontSize="inherit" />
          </IconButton>
          <Typography variant="body2" sx={{ color: media.length > 0 ? '#fff' : 'text.secondary', fontWeight: 600, mt: -0.5 }}>
            {snip.commentCount}
          </Typography>
        </Stack>
      </Tooltip>

      <IconButton
        size="large"
        sx={{ color: media.length > 0 ? '#fff' : 'text.secondary', fontSize: 32 }}
        onClick={() => setShareOpen(true)}
        aria-label="Share snip"
      >
        <IosShareRoundedIcon fontSize="inherit" />
      </IconButton>
    </Stack>
  )

  if (media.length === 0) {
    return (
      <Box
        sx={{
          position: 'relative',
          height: '100dvh',
          width: '100%',
          flexShrink: 0,
          scrollSnapAlign: 'start',
          scrollSnapStop: 'always',
          bgcolor: 'background.default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Paper variant="outlined" sx={{ p: 3, width: '100%', maxWidth: 420 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
            <Avatar
              src={snip.authorPhotoUrl}
              sx={{ width: 36, height: 36, cursor: 'pointer' }}
              onClick={() => navigate(`/${snip.authorUsername}`)}
            >
              {snip.authorName?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate(`/${snip.authorUsername}`)}>
                {snip.authorName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                @{snip.authorUsername}
              </Typography>
            </Box>
          </Stack>

          <Box
            sx={{
              fontSize: 18,
              lineHeight: 1.55,
              '& p': { m: 0, mb: 0.75 },
              '& p:last-child': { mb: 0 },
              '& a': { color: 'primary.main' },
              wordBreak: 'normal',
              overflowWrap: 'break-word',
            }}
            dangerouslySetInnerHTML={{ __html: caption }}
          />

          {(snip.tags ?? []).length > 0 && (
            <Stack direction="row" spacing={0.5} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
              {snip.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ borderRadius: 1, height: 22, fontSize: 12 }} />
              ))}
            </Stack>
          )}
        </Paper>

        {actionRail}
        <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} snip={snip} />
      </Box>
    )
  }

  return (
    <Box
      sx={{
        position: 'relative',
        height: '100dvh',
        width: '100%',
        flexShrink: 0,
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        bgcolor: '#000',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {isNearActive ? (
        <MediaCarousel
          items={media}
          videoMode="autoplay"
          active={active}
          muted={muted}
          onToggleMute={onToggleMute}
          objectFit="contain"
          dark
          sx={{ position: 'absolute', inset: 0 }}
        />
      ) : (
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={24} sx={{ color: 'rgba(255,255,255,0.3)' }} />
        </Box>
      )}

      {/* Bottom gradient keeps the caption/author overlay readable over media. */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '45%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.35) 55%, transparent)',
          pointerEvents: 'none',
        }}
      />

      <Stack
        spacing={1}
        sx={{
          position: 'absolute',
          left: 0,
          right: 76,
          bottom: 0,
          p: 2.5,
          pb: 4,
          color: '#fff',
        }}
      >
        {hasVideo && (
          // Browsers block unmuted autoplay outright, so video always
          // starts muted — this is the visible, unmissable affordance
          // (bottom-left, inside the readable caption area rather than a
          // small top-right icon easy to miss) to turn sound on.
          <Chip
            icon={muted ? <VolumeOffRoundedIcon /> : <VolumeUpRoundedIcon />}
            label={muted ? 'Tap for sound' : 'Sound on'}
            onClick={onToggleMute}
            size="small"
            sx={{
              alignSelf: 'flex-start',
              bgcolor: 'rgba(0,0,0,0.55)',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              '& .MuiChip-icon': { color: '#fff' },
            }}
          />
        )}

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Avatar
            src={snip.authorPhotoUrl}
            sx={{ width: 32, height: 32, cursor: 'pointer', border: '1.5px solid #fff' }}
            onClick={() => navigate(`/${snip.authorUsername}`)}
          >
            {snip.authorName?.[0]?.toUpperCase()}
          </Avatar>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate(`/${snip.authorUsername}`)}>
            @{snip.authorUsername}
          </Typography>
        </Stack>

        {caption && (
          <Box
            sx={{
              fontSize: 15,
              lineHeight: 1.45,
              maxHeight: '30vh',
              overflowY: 'auto',
              '& p': { m: 0, mb: 0.5 },
              '& p:last-child': { mb: 0 },
              '& a': { color: '#8ab4ff' },
              wordBreak: 'normal',
              overflowWrap: 'break-word',
            }}
            dangerouslySetInnerHTML={{ __html: caption }}
          />
        )}

        {(snip.tags ?? []).length > 0 && (
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
            {snip.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{ borderRadius: 1, height: 22, fontSize: 12, bgcolor: 'rgba(255,255,255,0.15)', color: '#fff' }}
              />
            ))}
          </Stack>
        )}
      </Stack>

      {actionRail}
      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} snip={snip} />
    </Box>
  )
}

/** A single full-screen slide in the doom-scroll feed. Snips with
 * image/video/YouTube content render it as a full-bleed carousel background
 * (video autoplaying while active) with a caption overlay; text-only snips
 * render as a regular snip card centered on the slide, so they still read
 * as "a snip" rather than a near-empty screen. Either way, an
 * Instagram-style vertical action rail sits bottom-right.
 *
 * Memoized: ScrollPage's queue can grow into the hundreds of items as the
 * viewer scrolls, and every slide previously re-rendered on every scroll
 * step (activeIndex changing re-renders the whole mapped list) — with
 * enough accumulated video elements this made even unrelated interactions
 * like the like button feel laggy. */
export const ScrollSlide = memo(ScrollSlideImpl)
