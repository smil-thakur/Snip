import { useState } from 'react'
import { formatDistanceToNowStrict } from 'date-fns'
import { Avatar, Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useAuth } from '../../context/AuthContext'
import { createComment, deleteComment } from '../../api/commentApi'
import { ConfirmDialog } from '../common/ConfirmDialog'
import type { Comment } from '../../types'

const MAX_VISUAL_DEPTH = 4
const INDENT_PX = 20

interface CommentThreadProps {
  comment: Comment
  snipId: string
  depth: number
  /** Re-fetches the whole tree from the parent CommentSection — simplest
   * correct way to reflect a new reply or a cascade-delete without hand-
   * splicing nested state. */
  onChanged: () => void
}

/** One comment plus its nested replies, indented per depth (capped so deep
 * threads don't run off narrow screens) with inline reply/delete actions. */
export function CommentThread({ comment, snipId, depth, onChanged }: CommentThreadProps) {
  const { profile } = useAuth()
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [posting, setPosting] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const isOwner = profile?.uid === comment.authorUid
  const indent = Math.min(depth, MAX_VISUAL_DEPTH) * INDENT_PX

  const handleReply = async () => {
    if (!replyText.trim()) return
    setPosting(true)
    try {
      await createComment(snipId, { parentId: comment.id, text: replyText.trim() })
      setReplyText('')
      setReplying(false)
      onChanged()
    } finally {
      setPosting(false)
    }
  }

  const handleDeleteConfirmed = async () => {
    setDeleteConfirmOpen(false)
    await deleteComment(comment.id)
    onChanged()
  }

  return (
    <Box sx={{ ml: `${indent}px`, mt: 1.5 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
        <Avatar src={comment.authorPhotoUrl} sx={{ width: 24, height: 24, fontSize: 12, flexShrink: 0 }}>
          {comment.authorName?.[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {comment.authorName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              @{comment.authorUsername}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              · {formatDistanceToNowStrict(new Date(comment.createdAt))} ago
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.25, wordBreak: 'normal', overflowWrap: 'break-word' }}>
            {comment.text}
          </Typography>
          <Stack direction="row" spacing={1.5} sx={{ mt: 0.25 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ cursor: 'pointer', fontWeight: 600 }}
              onClick={() => setReplying((v) => !v)}
            >
              Reply
            </Typography>
            {isOwner && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setDeleteConfirmOpen(true)}
              >
                Delete
              </Typography>
            )}
          </Stack>
          {replying && (
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <TextField
                size="small"
                fullWidth
                autoFocus
                placeholder="Write a reply…"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <Button size="small" variant="contained" onClick={handleReply} disabled={!replyText.trim() || posting}>
                Reply
              </Button>
            </Stack>
          )}
        </Box>
      </Stack>
      {comment.replies.map((child) => (
        <CommentThread key={child.id} comment={child} snipId={snipId} depth={depth + 1} onChanged={onChanged} />
      ))}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete this comment?"
        message="Its replies will be deleted too. This can't be undone."
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </Box>
  )
}
