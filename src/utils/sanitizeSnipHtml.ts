import DOMPurify from 'dompurify'

// Only the tags/attributes Quill's restricted toolbar can produce make it
// through — anything else (script, style, event handlers, etc.) is dropped
// regardless of what a client claims to have sent.
const TEXT_TAGS = ['p', 'br', 'strong', 'em', 'u', 'code', 'blockquote', 'ol', 'ul', 'li', 'a']
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [...TEXT_TAGS, 'img', 'video', 'source'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'controls', 'preload', 'poster', 'width', 'height', 'type'],
}
const CAPTION_ONLY_CONFIG = {
  ALLOWED_TAGS: TEXT_TAGS,
  ALLOWED_ATTR: ['href', 'target', 'rel'],
}

// Media src must point at our own Storage bucket — this is defense-in-depth
// on top of the backend's own check (see internal/post), since a crafted
// payload could otherwise hotlink arbitrary/tracking content into feeds.
const TRUSTED_MEDIA_PREFIX = `https://firebasestorage.googleapis.com/v0/b/${import.meta.env.VITE_FIREBASE_STORAGE_BUCKET}/o/`

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'IMG' || node.tagName === 'VIDEO' || node.tagName === 'SOURCE') {
    const src = node.getAttribute('src')
    if (src && !src.startsWith(TRUSTED_MEDIA_PREFIX)) {
      node.removeAttribute('src')
    }
  }
})

// Quill serializes typed spaces as &nbsp; rather than plain " " (to stop
// HTML's own whitespace collapsing from eating them). A non-breaking space
// is, by definition, not a line-wrap opportunity — so a run of several
// words strung together with &nbsp; becomes one long unbreakable token,
// which forces the browser to break it at an arbitrary character instead of
// wrapping between words. Swapping it back to a plain space after sanitizing
// is visually identical but restores normal word-wrapping.
const NBSP_PATTERN = /&nbsp;| /g
function restoreBreakableSpaces(html: string): string {
  return html.replace(NBSP_PATTERN, ' ')
}

/** Sanitizes a snip's contentHtml for rendering — shared by every place a
 * snip's rich text gets rendered so the allow-list/trusted-media check
 * can't drift out of sync between them. */
export function sanitizeSnipHtml(html: string): string {
  return restoreBreakableSpaces(DOMPurify.sanitize(html, SANITIZE_CONFIG))
}

/** Sanitizes contentHtml for caption-only display (ScrollPage's reel view,
 * which renders the snip's first image/video as a full-bleed background via
 * extractSnipMedia below, so the inline <img>/<video> tags shouldn't also
 * render again inside the text caption). */
export function sanitizeSnipCaption(html: string): string {
  return restoreBreakableSpaces(DOMPurify.sanitize(html, CAPTION_ONLY_CONFIG))
}

export type SnipMediaItem =
  | { type: 'image'; url: string }
  | { type: 'video'; url: string }
  | { type: 'youtube'; youtubeId: string; url: string }

const MEDIA_TAG_PATTERN = /<(img|video)\b[^>]*\ssrc="([^"]+)"/gi

// Matches youtube.com/watch?v=, youtu.be/, youtube.com/shorts/, and
// youtube.com/embed/ — covering both regular videos and Shorts, whether
// typed as plain text or turned into a link by Quill's link toolbar button.
const YOUTUBE_PATTERN = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/gi

/** Pulls every trusted image/video (uploaded to our own Storage bucket) and
 * every YouTube link out of a snip's raw contentHtml, in that order, for
 * carousel display. Runs on unsanitized HTML, but images/videos are only
 * ever used as a src attribute value on a real DOM element (never
 * re-injected as HTML) and are still checked against the trusted Storage
 * prefix — the same protection sanitizeSnipHtml's DOMPurify hook applies —
 * and YouTube embeds are only ever built from a strictly-validated 11-char
 * video ID, never from raw user HTML — so nothing here can smuggle in
 * arbitrary markup or an untrusted iframe src. */
export function extractSnipMediaList(html: string): SnipMediaItem[] {
  const items: SnipMediaItem[] = []

  for (const match of html.matchAll(MEDIA_TAG_PATTERN)) {
    const [, tag, src] = match
    if (!src.startsWith(TRUSTED_MEDIA_PREFIX)) continue
    items.push({ type: tag.toLowerCase() === 'video' ? 'video' : 'image', url: src })
  }

  const seenYoutubeIds = new Set<string>()
  for (const match of html.matchAll(YOUTUBE_PATTERN)) {
    const id = match[1]
    if (seenYoutubeIds.has(id)) continue
    seenYoutubeIds.add(id)
    items.push({ type: 'youtube', youtubeId: id, url: `https://www.youtube.com/watch?v=${id}` })
  }

  return items
}

/** Strips YouTube URL text out of an already-sanitized caption — once a
 * link's been pulled into the media carousel as a real embed, leaving the
 * raw URL sitting in the caption text right next to the playable embed
 * reads as unfinished. Safe to run on sanitizeSnipCaption's output: the
 * pattern only ever matches plain URL text, never markup. */
export function stripYoutubeLinksFromCaption(caption: string): string {
  return caption
    .replace(YOUTUBE_PATTERN, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/<p>\s*<\/p>/g, '')
    .trim()
}
