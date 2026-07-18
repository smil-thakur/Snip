import { useEffect, useRef, useState } from 'react'
import { Box, IconButton, type SxProps, type Theme } from '@mui/material'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import ZoomInRoundedIcon from '@mui/icons-material/ZoomInRounded'
import { ImageLightbox } from './ImageLightbox'
import type { SnipMediaItem } from '../../utils/sanitizeSnipHtml'

interface MediaCarouselProps {
  items: SnipMediaItem[]
  /** 'controls' (SnipCard): native browser video controls, no autoplay.
   * 'autoplay' (ScrollSlide): muted-autoplay-while-active, Reels-style. */
  videoMode: 'controls' | 'autoplay'
  /** Only meaningful for videoMode="autoplay" — whether this carousel's
   * parent slide is the one currently in view. */
  active?: boolean
  muted?: boolean
  onToggleMute?: () => void
  objectFit?: 'cover' | 'contain'
  /** Fixed aspect ratio box (SnipCard); omit to fill the parent's height
   * (ScrollSlide's full-bleed background). */
  aspectRatio?: string
  /** Dot indicator color scheme — ScrollSlide sits over a dark background,
   * SnipCard over a light card. */
  dark?: boolean
  sx?: SxProps<Theme>
}

/** Swipeable (and arrow-clickable) media carousel shared by SnipCard and
 * ScrollSlide — a snip can carry multiple images/videos/YouTube links, and
 * both places need the same "swipe between them, dots show position"
 * behavior, just with different sizing and video playback rules. */
export function MediaCarousel({
  items,
  videoMode,
  active = true,
  muted,
  onToggleMute,
  objectFit = 'cover',
  aspectRatio,
  dark = false,
  sx,
}: MediaCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const [index, setIndex] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const tickingRef = useRef(false)

  const handleScroll = () => {
    if (tickingRef.current) return
    tickingRef.current = true
    requestAnimationFrame(() => {
      const el = containerRef.current
      if (el && el.clientWidth > 0) {
        const i = Math.round(el.scrollLeft / el.clientWidth)
        setIndex((prev) => (prev === i ? prev : i))
      }
      tickingRef.current = false
    })
  }

  const scrollToIndex = (next: number) => {
    const el = containerRef.current
    if (!el) return
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
  }

  useEffect(() => {
    if (videoMode !== 'autoplay') return
    videoRefs.current.forEach((video, i) => {
      if (!video) return
      if (active && i === index) {
        video.currentTime = 0
        void video.play().catch(() => {})
      } else {
        video.pause()
      }
    })
  }, [active, index, videoMode])

  if (items.length === 0) return null

  const dotOn = dark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)'
  const dotOff = dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)'
  const arrowColor = dark ? '#fff' : undefined
  const arrowBg = dark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.8)'
  const arrowBgHover = dark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.95)'

  const imageUrls = items.filter((item): item is Extract<SnipMediaItem, { type: 'image' }> => item.type === 'image').map((item) => item.url)

  return (
    <Box sx={{ position: 'relative', ...sx }}>
      <Box
        ref={containerRef}
        onScroll={handleScroll}
        sx={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          height: '100%',
          ...(aspectRatio ? { aspectRatio } : {}),
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {items.map((item, i) => (
          <Box key={i} sx={{ flexShrink: 0, width: '100%', height: '100%', scrollSnapAlign: 'start', position: 'relative' }}>
            {item.type === 'youtube' ? (
              videoMode === 'autoplay' ? (
                // Framed with real margin instead of full-bleed: in the
                // Reels view our own overlaid caption/action-rail/mute-chip
                // sit on top of the raw iframe area, which visually and
                // interactively blocked YouTube's own control bar
                // underneath. Insetting the player leaves it fully clear.
                //
                // The inset box (a plain div) is what's absolutely
                // positioned against the four edges; the iframe inside it
                // is just width/height 100% of THAT box. An iframe is a
                // replaced element, and giving a replaced element "auto"
                // width/height while also absolutely positioning all four
                // edges resolves to its intrinsic default size (300x150),
                // not a stretch-to-fill — it needs an ordinary sized parent
                // to fill instead.
                <Box sx={{ position: 'absolute', top: 16, left: 16, right: 88, bottom: 210, borderRadius: 2, overflow: 'hidden', bgcolor: '#000' }}>
                  <Box
                    component="iframe"
                    src={`https://www.youtube-nocookie.com/embed/${item.youtubeId}?rel=0&playsinline=1${
                      active && i === index ? '&autoplay=1&mute=1' : ''
                    }`}
                    title="YouTube video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    sx={{ width: '100%', height: '100%', border: 0, display: 'block' }}
                  />
                </Box>
              ) : (
                <Box
                  component="iframe"
                  src={`https://www.youtube-nocookie.com/embed/${item.youtubeId}?rel=0&playsinline=1`}
                  title="YouTube video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  sx={{ width: '100%', height: '100%', border: 0, display: 'block', bgcolor: '#000' }}
                />
              )
            ) : item.type === 'video' ? (
              <Box
                component="video"
                ref={(el: HTMLVideoElement | null) => {
                  videoRefs.current[i] = el
                }}
                src={item.url}
                muted={videoMode === 'autoplay' ? muted : undefined}
                controls={videoMode === 'controls'}
                loop={videoMode === 'autoplay'}
                playsInline
                preload="metadata"
                onClick={videoMode === 'autoplay' ? onToggleMute : undefined}
                sx={{ width: '100%', height: '100%', objectFit, display: 'block', cursor: videoMode === 'autoplay' ? 'pointer' : undefined }}
              />
            ) : (
              <Box
                component="img"
                src={item.url}
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex(imageUrls.indexOf(item.url))
                }}
                sx={{ width: '100%', height: '100%', objectFit, display: 'block', cursor: 'zoom-in' }}
              />
            )}
            {item.type === 'image' && (
              <ZoomInRoundedIcon
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  color: '#fff',
                  bgcolor: 'rgba(0,0,0,0.4)',
                  borderRadius: '50%',
                  p: 0.4,
                  fontSize: 26,
                  pointerEvents: 'none',
                }}
              />
            )}
          </Box>
        ))}
      </Box>

      {items.length > 1 && (
        <>
          <IconButton
            size="small"
            onClick={() => scrollToIndex(Math.max(0, index - 1))}
            disabled={index === 0}
            aria-label="Previous media"
            sx={{
              position: 'absolute',
              left: 4,
              top: '50%',
              transform: 'translateY(-50%)',
              color: arrowColor,
              bgcolor: arrowBg,
              '&:hover': { bgcolor: arrowBgHover },
              '&.Mui-disabled': { opacity: 0, pointerEvents: 'none' },
            }}
          >
            <ChevronLeftRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => scrollToIndex(Math.min(items.length - 1, index + 1))}
            disabled={index === items.length - 1}
            aria-label="Next media"
            sx={{
              position: 'absolute',
              right: 4,
              top: '50%',
              transform: 'translateY(-50%)',
              color: arrowColor,
              bgcolor: arrowBg,
              '&:hover': { bgcolor: arrowBgHover },
              '&.Mui-disabled': { opacity: 0, pointerEvents: 'none' },
            }}
          >
            <ChevronRightRoundedIcon fontSize="small" />
          </IconButton>

          <Box sx={{ position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 0.5 }}>
            {items.map((_, i) => (
              <Box key={i} sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: i === index ? dotOn : dotOff }} />
            ))}
          </Box>
        </>
      )}

      {lightboxIndex !== null && (
        <ImageLightbox images={imageUrls} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onNavigate={setLightboxIndex} />
      )}
    </Box>
  )
}
