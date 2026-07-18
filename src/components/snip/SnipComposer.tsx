import { useMemo, useRef, useState } from 'react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { Autocomplete, Box, Button, LinearProgress, Paper, Stack, TextField, Typography } from '@mui/material'
import { createSnip } from '../../api/snipApi'
import { useAuth } from '../../context/AuthContext'
import { RECOMMENDED_TAGS } from '../../constants/tags'
import { QUILL_TOOLBAR, createMediaHandlers, quillWrapperSx } from './quillConfig'
import type { Snip } from '../../types'

const MAX_LENGTH = 1000
const MAX_TAGS = 3

interface SnipComposerProps {
  onPosted: (snip: Snip) => void
}

/** Rich-text composer for publishing a new snip. Captures the Quill Delta
 * (for possible future re-editing) alongside derived HTML/plain-text used
 * for rendering and length limits. */
export function SnipComposer({ onPosted }: SnipComposerProps) {
  const { firebaseUser } = useAuth()
  const [html, setHtml] = useState('')
  const [plainLength, setPlainLength] = useState(0)
  const [hasMedia, setHasMedia] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [posting, setPosting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const quillRef = useRef<ReactQuill>(null)

  // A snip with only an attached image/video and no text is still postable
  // (Twitter/X-style) — plain text length alone isn't the right emptiness
  // check once media embeds are possible.
  const isEmpty = plainLength === 0 && !hasMedia
  const overLimit = plainLength > MAX_LENGTH

  // Keyed on the uid string (not the firebaseUser object) — Firebase Auth
  // can re-emit a new User object for the same logical session (e.g. right
  // after updateProfile() during signup), and memoizing on object identity
  // there caused ReactQuill to reinitialize mid-render and spiral into a
  // setState loop.
  const uid = firebaseUser?.uid
  const mediaHandlers = useMemo(
    () => (uid ? createMediaHandlers(quillRef, { uid, setUploading, setError }) : undefined),
    [uid],
  )
  const modules = useMemo(
    () => ({ toolbar: { container: QUILL_TOOLBAR, handlers: mediaHandlers } }),
    [mediaHandlers],
  )

  const handleChange = (content: string) => {
    setHtml(content)
    const text = quillRef.current?.getEditor().getText() ?? ''
    setPlainLength(text.trim().length)
    setHasMedia(/<(img|video)\b/i.test(content))
  }

  const handlePost = async () => {
    const editor = quillRef.current?.getEditor()
    if (!editor || isEmpty || overLimit) return

    setPosting(true)
    setError(null)
    try {
      const snip = await createSnip({
        contentDelta: editor.getContents(),
        contentHtml: html,
        contentText: editor.getText().trim(),
        tags,
      })
      onPosted(snip)
      editor.setText('')
      setHtml('')
      setPlainLength(0)
      setHasMedia(false)
      setTags([])
    } catch {
      setError('Could not post your snip. Please try again.')
    } finally {
      setPosting(false)
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
      {uploading && <LinearProgress sx={{ mb: 1 }} />}
      <Box sx={quillWrapperSx}>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          // Uncontrolled on purpose: react-quill-new's controlled mode
          // (`value=`) does a byte-for-byte string comparison between the
          // prop and the live DOM's serialized HTML on every render, and
          // any round-trip quirk (e.g. space vs &nbsp; normalization
          // timing) forces a re-sync that re-fires the change event —
          // a real infinite setState loop under the right timing. `html`
          // state is still tracked via onChange for the char count/submit
          // payload; it's just never fed back into the editor.
          defaultValue={html}
          onChange={handleChange}
          modules={modules}
          placeholder="Share something you just learned…"
        />
      </Box>

      <Autocomplete
        multiple
        freeSolo
        size="small"
        options={RECOMMENDED_TAGS}
        value={tags}
        onChange={(_, newValue) => {
          const next = newValue.map((v) => v.trim()).filter(Boolean)
          if (next.length <= MAX_TAGS) setTags(next)
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="standard"
            placeholder={tags.length < MAX_TAGS ? 'Add up to 3 tags (optional)' : ''}
            helperText={tags.length >= MAX_TAGS ? 'Up to 3 tags' : undefined}
          />
        )}
        sx={{ mt: 1.5 }}
      />

      {error && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
          {error}
        </Typography>
      )}

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'flex-end', mt: 1.5 }}>
        <Typography variant="caption" color={overLimit ? 'error' : 'text.secondary'}>
          {plainLength}/{MAX_LENGTH}
        </Typography>
        <Button variant="contained" size="small" onClick={handlePost} disabled={isEmpty || overLimit || posting}>
          Post
        </Button>
      </Stack>
    </Paper>
  )
}
