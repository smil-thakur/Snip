import { Quill } from 'react-quill-new'
import type ReactQuill from 'react-quill-new'
import type { RefObject } from 'react'
import type { SxProps, Theme } from '@mui/material'
import { uploadSnipMedia, MediaValidationError, type MediaKind } from '../../firebase/mediaUpload'

/** Restricted toolbar shared by every Quill instance in the app (composer,
 * edit dialog) — keeps the sanitize allow-list in SnipCard small and the
 * XSS surface minimal. */
export const QUILL_TOOLBAR = [
  ['bold', 'italic', 'underline', 'code'],
  ['blockquote', { list: 'ordered' }, { list: 'bullet' }],
  ['link'],
  ['image', 'video'],
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
  '& .ql-editor img, & .ql-editor video': { maxWidth: '100%', borderRadius: 4, display: 'block' },
}

// Quill's built-in "video" format renders an <iframe> (meant for YouTube/
// Vimeo-style embeds), not a native <video> tag — wrong for a file we host
// ourselves. Register a distinct format so it doesn't collide with the
// built-in one, backed by a real <video> element.
const BlockEmbed = Quill.import('blots/block/embed') as {
  new (...args: unknown[]): { domNode: HTMLElement }
  create(value: unknown): HTMLElement
  blotName: string
  tagName: string
}

class SnipVideoBlot extends BlockEmbed {
  static blotName = 'snipVideo'
  static tagName = 'video'

  static create(url: string) {
    const node = super.create(url) as HTMLVideoElement
    node.setAttribute('src', url)
    node.setAttribute('controls', '')
    node.setAttribute('preload', 'metadata')
    return node
  }

  static value(node: HTMLVideoElement) {
    return node.getAttribute('src')
  }
}

// Quill's own TS types don't model dynamically-registered blot classes as a
// RegistryDefinition, so this cast is unavoidable — the runtime shape is
// exactly what Quill.register expects (a BlotConstructor).
Quill.register(SnipVideoBlot as unknown as Parameters<typeof Quill.register>[0], true)

interface MediaHandlersOptions {
  uid: string
  setUploading: (uploading: boolean) => void
  setError: (message: string) => void
}

/** Returns the { image, video } toolbar handlers Quill calls when those
 * buttons are clicked. Shared by SnipComposer and EditSnipDialog so both
 * get identical upload/validation/insertion behavior. */
export function createMediaHandlers(
  quillRef: RefObject<ReactQuill | null>,
  { uid, setUploading, setError }: MediaHandlersOptions,
) {
  function pickAndUpload(kind: MediaKind) {
    const editor = quillRef.current?.getEditor()
    if (!editor) return
    const range = editor.getSelection(true)

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = kind === 'image' ? 'image/*' : 'video/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      setUploading(true)
      try {
        const url = await uploadSnipMedia(file, uid, kind)
        const insertAt = range?.index ?? editor.getLength()
        editor.insertEmbed(insertAt, kind === 'image' ? 'image' : 'snipVideo', url, 'user')
        editor.setSelection(insertAt + 1, 0, 'user')
      } catch (err) {
        setError(
          err instanceof MediaValidationError
            ? err.message
            : `Could not upload ${kind}. Please try again.`,
        )
      } finally {
        setUploading(false)
      }
    }
    input.click()
  }

  return {
    image: () => pickAndUpload('image'),
    video: () => pickAndUpload('video'),
  }
}
