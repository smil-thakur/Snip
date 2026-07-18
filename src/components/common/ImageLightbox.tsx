import { Backdrop, Box, IconButton } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'

interface ImageLightboxProps {
  images: string[]
  index: number
  onClose: () => void
  onNavigate: (nextIndex: number) => void
}

/** Full-screen tap-to-zoom view for a snip's image(s) — opened by clicking
 * an image in MediaCarousel, in either SnipCard or the Scroll feed. */
export function ImageLightbox({ images, index, onClose, onNavigate }: ImageLightboxProps) {
  if (index < 0 || index >= images.length) return null

  return (
    <Backdrop
      open
      onClick={onClose}
      sx={{ zIndex: (theme) => theme.zIndex.modal + 20, bgcolor: 'rgba(0,0,0,0.92)' }}
    >
      <IconButton onClick={onClose} aria-label="Close image" sx={{ position: 'absolute', top: 12, right: 12, color: '#fff' }}>
        <CloseRoundedIcon />
      </IconButton>

      {images.length > 1 && (
        <>
          <IconButton
            onClick={(e) => {
              e.stopPropagation()
              onNavigate((index - 1 + images.length) % images.length)
            }}
            aria-label="Previous image"
            sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#fff' }}
          >
            <ChevronLeftRoundedIcon />
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.stopPropagation()
              onNavigate((index + 1) % images.length)
            }}
            aria-label="Next image"
            sx={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#fff' }}
          >
            <ChevronRightRoundedIcon />
          </IconButton>
        </>
      )}

      <Box
        component="img"
        src={images[index]}
        onClick={(e) => e.stopPropagation()}
        sx={{ maxWidth: '92vw', maxHeight: '92vh', objectFit: 'contain', borderRadius: 1 }}
      />
    </Backdrop>
  )
}
