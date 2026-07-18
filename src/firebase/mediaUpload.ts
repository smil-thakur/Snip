import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { firebaseStorage } from './config'
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES } from '../constants/media'

export type MediaKind = 'image' | 'video'

/** Thrown for client-side validation failures — distinguishable from
 * network/upload errors so callers can show a more specific message. */
export class MediaValidationError extends Error {}

function validate(file: File, kind: MediaKind) {
  const allowedTypes = kind === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES
  const maxBytes = kind === 'image' ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES

  if (!allowedTypes.includes(file.type)) {
    throw new MediaValidationError(`Unsupported ${kind} type: ${file.type || 'unknown'}`)
  }
  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024))
    throw new MediaValidationError(`${kind === 'image' ? 'Images' : 'Videos'} must be ${maxMb}MB or smaller`)
  }
}

function extensionFor(file: File): string {
  const parts = file.name.split('.')
  return parts.length > 1 ? `.${parts.pop()}` : ''
}

/** Uploads a snip attachment directly to Firebase Storage (never through our
 * own backend — see project notes for why) and resolves with its public
 * download URL. Validates size/type client-side first purely for fast UX
 * feedback; snips.backend/storage.rules is what actually enforces this. */
export async function uploadSnipMedia(
  file: File,
  uid: string,
  kind: MediaKind,
  onProgress?: (fraction: number) => void,
): Promise<string> {
  validate(file, kind)

  const filename = `${Date.now()}-${crypto.randomUUID()}${extensionFor(file)}`
  const storageRef = ref(firebaseStorage, `snip-media/${uid}/${filename}`)
  const task = uploadBytesResumable(storageRef, file, { contentType: file.type })

  await new Promise<void>((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => onProgress?.(snapshot.bytesTransferred / snapshot.totalBytes),
      reject,
      () => resolve(),
    )
  })

  return getDownloadURL(task.snapshot.ref)
}
