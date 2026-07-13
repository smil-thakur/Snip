import { useRef, useState } from 'react'
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
  TextField,
  Typography,
} from '@mui/material'
import { updateSnip } from '../../api/snipApi'
import { RECOMMENDED_TAGS } from '../../constants/tags'
import { QUILL_TOOLBAR, quillWrapperSx } from './quillConfig'
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
  const [html, setHtml] = useState(snip.contentHtml)
  const [plainLength, setPlainLength] = useState(snip.contentText.length)
  const [tags, setTags] = useState<string[]>(snip.tags ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const quillRef = useRef<ReactQuill>(null)

  const isEmpty = plainLength === 0
  const overLimit = plainLength > MAX_LENGTH

  const handleChange = (content: string) => {
    setHtml(content)
    const text = quillRef.current?.getEditor().getText() ?? ''
    setPlainLength(text.trim().length)
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
        <Box sx={quillWrapperSx}>
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={html}
            onChange={handleChange}
            modules={{ toolbar: QUILL_TOOLBAR }}
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
