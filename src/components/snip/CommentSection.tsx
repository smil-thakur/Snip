import { useCallback, useEffect, useState } from 'react'
import { Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material'
import { CommentThread } from './CommentThread'
import { listComments, createComment } from '../../api/commentApi'
import type { Comment } from '../../types'

interface CommentSectionProps {
  snipId: string
}

/** Comment thread for a snip's permalink page: a plain-text composer for
 * top-level comments, plus the full nested reply tree below it. */
export function CommentSection({ snipId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [newText, setNewText] = useState('')
  const [posting, setPosting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const list = await listComments(snipId)
      setComments(list)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [snipId])

  useEffect(() => {
    void load()
  }, [load])

  const handlePostTopLevel = async () => {
    if (!newText.trim()) return
    setPosting(true)
    try {
      await createComment(snipId, { text: newText.trim() })
      setNewText('')
      await load()
    } finally {
      setPosting(false)
    }
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
        Comments
      </Typography>

      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <TextField
          size="small"
          fullWidth
          multiline
          maxRows={4}
          placeholder="Add a comment…"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
        />
        <Button variant="contained" size="small" onClick={handlePostTopLevel} disabled={!newText.trim() || posting}>
          Post
        </Button>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={20} />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Couldn't load comments.
          </Typography>
          <Button size="small" onClick={() => void load()}>
            Retry
          </Button>
        </Box>
      ) : comments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
          No comments yet. Be the first to reply.
        </Typography>
      ) : (
        comments.map((c) => <CommentThread key={c.id} comment={c} snipId={snipId} depth={0} onChanged={load} />)
      )}
    </Box>
  )
}
