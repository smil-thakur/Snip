/** Client-side validation only — the real enforcement lives in
 * snips.backend/storage.rules, since anything checked here is trivially
 * bypassable by a client that skips this code entirely. This just gives
 * fast feedback before spending the user's upload bandwidth. */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const MAX_VIDEO_BYTES = 10 * 1024 * 1024

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm']
