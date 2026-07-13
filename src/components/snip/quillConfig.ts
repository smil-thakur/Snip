import type { SxProps, Theme } from '@mui/material'

/** Restricted toolbar shared by every Quill instance in the app (composer,
 * edit dialog) — keeps the sanitize allow-list in SnipCard small and the
 * XSS surface minimal. */
export const QUILL_TOOLBAR = [
  ['bold', 'italic', 'underline', 'code'],
  ['blockquote', { list: 'ordered' }, { list: 'bullet' }],
  ['link'],
  ['clean'],
]

/** Wrapper sx for a Quill instance: strips Quill's default chrome/padding
 * so it reads as a plain text box matching the rest of the UI. */
export const quillWrapperSx: SxProps<Theme> = {
  '& .ql-toolbar': { border: 'none', borderBottom: '1px solid', borderColor: 'divider', px: 0 },
  '& .ql-container': { border: 'none', fontSize: 15, fontFamily: 'inherit' },
  '& .ql-editor': { minHeight: 90, px: 0 },
  // Quill's snow theme hardcodes left/right: 15px on the placeholder
  // pseudo-element to match its default editor padding; since we zero that
  // padding out above, the placeholder needs the same override or it
  // renders indented relative to typed text.
  '& .ql-editor.ql-blank::before': { left: 0, right: 0, color: 'text.secondary', fontStyle: 'normal' },
}
