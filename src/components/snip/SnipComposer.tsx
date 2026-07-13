import { useRef, useState } from 'react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { Autocomplete, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { createSnip } from '../../api/snipApi'
import { RECOMMENDED_TAGS } from '../../constants/tags'
import { QUILL_TOOLBAR, quillWrapperSx } from './quillConfig'
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
  const [html, setHtml] = useState('')
  const [plainLength, setPlainLength] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const quillRef = useRef<ReactQuill>(null)

  const isEmpty = plainLength === 0
  const overLimit = plainLength > MAX_LENGTH

  const handleChange = (content: string) => {
    setHtml(content)
    const text = quillRef.current?.getEditor().getText() ?? ''
    setPlainLength(text.trim().length)
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
      setTags([])
    } catch {
      setError('Could not post your snip. Please try again.')
    } finally {
      setPosting(false)
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
      <Box sx={quillWrapperSx}>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={html}
          onChange={handleChange}
          modules={{ toolbar: QUILL_TOOLBAR }}
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
