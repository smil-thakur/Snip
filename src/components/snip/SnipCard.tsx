import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNowStrict } from 'date-fns'
import { Avatar, Box, Chip, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material'
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'
import { LikeButton } from '../social/LikeButton'
import { ShareDialog } from './ShareDialog'
import { EditSnipDialog } from './EditSnipDialog'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { MediaCarousel } from '../common/MediaCarousel'
import { useAuth } from '../../context/AuthContext'
import { deleteSnip } from '../../api/snipApi'
import { sanitizeSnipCaption, extractSnipMediaList, stripYoutubeLinksFromCaption } from '../../utils/sanitizeSnipHtml'
import type { Snip } from '../../types'

interface SnipCardProps {
  snip: Snip
  onDeleted?: (id: string) => void
  onUpdated?: (snip: Snip) => void
}

/** A single published snip: author, sanitized rich-text content, like
 * count, comment count, and share/edit entry points. */
export function SnipCard({ snip, onDeleted, onUpdated }: SnipCardProps) {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [shareOpen, setShareOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const media = useMemo(() => extractSnipMediaList(snip.contentHtml), [snip.contentHtml])
  const caption = useMemo(() => {
    const raw = sanitizeSnipCaption(snip.contentHtml)
    return media.some((m) => m.type === 'youtube') ? stripYoutubeLinksFromCaption(raw) : raw
  }, [snip.contentHtml, media])
  const isOwner = profile?.uid === snip.authorUid

  const handleDeleteConfirmed = async () => {
    setDeleteConfirmOpen(false)
    await deleteSnip(snip.id)
    onDeleted?.(snip.id)
  }

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, mb: 2, cursor: 'pointer', '&:hover': { borderColor: 'text.secondary' } }}
      onClick={() => navigate(`/s/${snip.id}`)}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.25 }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/${snip.authorUsername}`)
          }}
        >
          <Avatar src={snip.authorPhotoUrl} sx={{ width: 28, height: 28, fontSize: 14, flexShrink: 0 }}>
            {snip.authorName?.[0]?.toUpperCase()}
          </Avatar>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700 }}>
            {snip.authorName}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            @{snip.authorUsername}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          ·
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {formatDistanceToNowStrict(new Date(snip.createdAt))} ago
        </Typography>
        {snip.edited && (
          <Tooltip title={`Edited ${formatDistanceToNowStrict(new Date(snip.updatedAt))} ago`}>
            <Typography variant="body2" color="text.secondary" noWrap>
              · edited
            </Typography>
          </Tooltip>
        )}
      </Stack>

      {caption && (
        <Box
          sx={{
            mt: 1,
            fontSize: 15,
            lineHeight: 1.5,
            '& p': { m: 0, mb: 0.75 },
            '& p:last-child': { mb: 0 },
            '& a': { color: 'primary.main' },
            // break-word (not break-all) so only a single unbreakable token
            // (e.g. a long URL) wraps mid-word — normal words always wrap
            // as whole words first.
            wordBreak: 'normal',
            overflowWrap: 'break-word',
          }}
          dangerouslySetInnerHTML={{ __html: caption }}
        />
      )}

      {media.length > 0 && (
        <Box sx={{ mt: 1 }} onClick={(e) => e.stopPropagation()}>
          <MediaCarousel
            items={media}
            videoMode="controls"
            aspectRatio="16/9"
            objectFit="cover"
            sx={{ borderRadius: 1, overflow: 'hidden', bgcolor: 'action.hover' }}
          />
        </Box>
      )}

      {(snip.tags ?? []).length > 0 && (
        <Stack direction="row" spacing={0.5} sx={{ mt: 0.75, flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
          {snip.tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              variant="outlined"
              onClick={() => navigate(`/discover?tab=search&tag=${encodeURIComponent(tag)}`)}
              sx={{ borderRadius: 1, height: 22, fontSize: 12 }}
            />
          ))}
        </Stack>
      )}

      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 1 }} onClick={(e) => e.stopPropagation()}>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <LikeButton snipId={snip.id} initialLiked={snip.likedByMe} initialCount={snip.likeCount} />
          <Tooltip title="Comments">
            <Stack
              direction="row"
              spacing={0.5}
              sx={{ alignItems: 'center', cursor: 'pointer', color: 'text.secondary', px: 0.5 }}
              onClick={() => navigate(`/s/${snip.id}`)}
            >
              <IconButton size="small" component="span" aria-label="View comments">
                <ChatBubbleOutlineRoundedIcon fontSize="small" />
              </IconButton>
              <Typography variant="body2" color="text.secondary">
                {snip.commentCount}
              </Typography>
            </Stack>
          </Tooltip>
        </Stack>
        <Stack direction="row">
          {isOwner && (
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => setEditOpen(true)} aria-label="Edit snip">
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {isOwner && (
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  setDeleteConfirmOpen(true)
                }}
                aria-label="Delete snip"
              >
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Share">
            <IconButton size="small" onClick={() => setShareOpen(true)} aria-label="Share snip">
              <IosShareRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} snip={snip} />
      {isOwner && (
        <EditSnipDialog
          open={editOpen}
          snip={snip}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => {
            setEditOpen(false)
            onUpdated?.(updated)
          }}
        />
      )}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete this snip?"
        message="This can't be undone."
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </Paper>
  )
}
