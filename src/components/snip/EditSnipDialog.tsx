import { useMemo, useRef, useState } from 'react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  TextField,
  Typography,
} from '@mui/material'
import { updateSnip } from '../../api/snipApi'
import { useAuth } from '../../context/AuthContext'
import { RECOMMENDED_TAGS } from '../../constants/tags'
import { QUILL_TOOLBAR, createMediaHandlers, quillWrapperSx } from './quillConfig'
import type { Snip } from '../../types'

const MAX_LENGTH = 1000
const MAX_TAGS = 3

interface EditSnipDialogProps {
  open: boolean
  snip: Snip
  onClose: () => void
  onSaved: (snip: Snip) => void
}

/** Dialog for editing an existing snip's content and tags. Mirrors
 * SnipComposer's Quill setup (shared via quillConfig) but pre-fills from
 * the snip being edited and calls updateSnip instead of createSnip. */
export function EditSnipDialog({ open, snip, onClose, onSaved }: EditSnipDialogProps) {
  const { firebaseUser } = useAuth()
  const [html, setHtml] = useState(snip.contentHtml)
  const [plainLength, setPlainLength] = useState(snip.contentText.length)
  const [hasMedia, setHasMedia] = useState(/<(img|video)\b/i.test(snip.contentHtml))
  const [tags, setTags] = useState<string[]>(snip.tags ?? [])
  const [saving, setSaving] = useState(false)
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

  const handleSave = async () => {
    const editor = quillRef.current?.getEditor()
    if (!editor || isEmpty || overLimit) return

    setSaving(true)
    setError(null)
    try {
      const updated = await updateSnip(snip.id, {
        contentDelta: editor.getContents(),
        contentHtml: html,
        contentText: editor.getText().trim(),
        tags,
      })
      onSaved(updated)
    } catch {
      setError('Could not save your changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      // See ConfirmDialog/ShareDialog for why this is needed: MUI portals
      // still bubble React synthetic events up the component tree, and
      // this dialog is opened from inside SnipCard's clickable Paper.
      // Without this, clicking Cancel (or anything else in here) bubbles
      // up and triggers SnipCard's navigate-to-detail handler.
      onClick={(e) => e.stopPropagation()}
    >
      <DialogTitle>Edit snip</DialogTitle>
      <DialogContent>
        {uploading && <LinearProgress sx={{ mb: 1 }} />}
        <Box sx={quillWrapperSx}>
          <ReactQuill
            ref={quillRef}
            theme="snow"
            // Uncontrolled on purpose — see SnipComposer for why: react-quill-new's
            // controlled `value=` mode can spiral into an infinite setState loop
            // when the prop and the live DOM's serialized HTML don't round-trip
            // byte-for-byte identical.
            defaultValue={html}
            onChange={handleChange}
            modules={modules}
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

        <Typography variant="caption" color={overLimit ? 'error' : 'text.secondary'} sx={{ display: 'block', mt: 1, textAlign: 'right' }}>
          {plainLength}/{MAX_LENGTH}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={isEmpty || overLimit || saving}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}
