import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Chip, CircularProgress, IconButton, Stack, Typography } from '@mui/material'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { ScrollSlide } from '../components/scroll/ScrollSlide'
import { CommentDrawer } from '../components/scroll/CommentDrawer'
import { getDiscoverFeed } from '../api/feedApi'
import { searchSnips } from '../api/snipApi'
import { RECOMMENDED_TAGS } from '../constants/tags'
import { SCROLL_PHONE_WIDTH } from '../constants/scroll'
import type { Snip } from '../types'

const MAX_POOL_PAGES = 5
// How close to the end of the rendered queue (in slides) before another
// shuffled pass of the pool gets appended — keeps the scroll seamless.
const APPEND_THRESHOLD = 3

interface QueueItem {
  snip: Snip
  key: string
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

async function fetchPool(tag: string | null): Promise<Snip[]> {
  const seen = new Map<string, Snip>()
  let cursor: string | undefined
  for (let page = 0; page < MAX_POOL_PAGES; page++) {
    const result = tag ? await searchSnips({ tags: [tag] }, cursor) : await getDiscoverFeed('recent', cursor)
    for (const snip of result.snips ?? []) seen.set(snip.id, snip)
    cursor = result.nextCursor
    if (!cursor) break
  }
  return Array.from(seen.values())
}

/** Doom-scroll tab: a full-screen, vertically snapping feed (Reels/TikTok
 * style) built from a fetched "pool" of snips that gets reshuffled and
 * re-appended once exhausted — the content library is small enough today
 * that a straight infinite-scroll would just run dry, so this recycles the
 * same pool in a new random order indefinitely instead. */
export function ScrollPage() {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const tickingRef = useRef(false)
  const occurrenceRef = useRef(0)

  const [tag, setTag] = useState<string | null>(null)
  const [pool, setPool] = useState<Snip[]>([])
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  // Shared across every slide, not per-slide: once the viewer unmutes one
  // video (satisfying the browser's user-gesture requirement), every video
  // from then on should autoplay with sound — otherwise each new slide
  // resets to muted and needs its own click.
  const [muted, setMuted] = useState(true)
  const [commentSnip, setCommentSnip] = useState<Snip | null>(null)
  // Stable reference — ScrollSlide is memoized, and an inline arrow function
  // here would give every slide a "new" prop on every ScrollPage render,
  // defeating that memoization.
  const onToggleMute = useCallback(() => setMuted((m) => !m), [])

  const load = useCallback(async (activeTag: string | null) => {
    setLoading(true)
    setError(false)
    occurrenceRef.current = 0
    try {
      const fetchedPool = await fetchPool(activeTag)
      const shuffled = shuffle(fetchedPool)
      setPool(fetchedPool)
      setQueue(shuffled.map((snip, i) => ({ snip, key: `${snip.id}-0-${i}` })))
      setActiveIndex(0)
      if (containerRef.current) containerRef.current.scrollTop = 0
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(tag)
  }, [tag, load])

  // Append another shuffled pass of the pool once the viewer nears the end
  // of the currently rendered queue.
  useEffect(() => {
    if (pool.length === 0 || queue.length === 0) return
    if (activeIndex < queue.length - APPEND_THRESHOLD) return

    setQueue((prev) => {
      const batch = shuffle(pool)
      if (pool.length > 1 && prev.length > 0 && batch[0].id === prev[prev.length - 1].snip.id) {
        ;[batch[0], batch[1]] = [batch[1], batch[0]]
      }
      const batchNum = ++occurrenceRef.current
      return [...prev, ...batch.map((snip, i) => ({ snip, key: `${snip.id}-${batchNum}-${i}` }))]
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, queue.length, pool])

  const handleScroll = () => {
    if (tickingRef.current) return
    tickingRef.current = true
    requestAnimationFrame(() => {
      const el = containerRef.current
      if (el && el.clientHeight > 0) {
        const index = Math.round(el.scrollTop / el.clientHeight)
        setActiveIndex((prev) => (prev === index ? prev : index))
      }
      tickingRef.current = false
    })
  }

  return (
    <Box sx={{ position: 'fixed', inset: 0, bgcolor: '#000', zIndex: (t) => t.zIndex.modal }}>
      <Box sx={{ position: 'relative', height: '100%', width: '100%', maxWidth: SCROLL_PHONE_WIDTH, mx: 'auto' }}>
        <IconButton
          onClick={() => navigate('/')}
          aria-label="Back to feed"
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 2,
            color: '#fff',
            bgcolor: 'rgba(0,0,0,0.35)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' },
          }}
        >
          <ArrowBackRoundedIcon />
        </IconButton>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            position: 'absolute',
            top: 12,
            left: 60,
            right: 12,
            zIndex: 2,
            overflowX: 'auto',
            pb: 0.5,
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {[null, ...RECOMMENDED_TAGS].map((t) => (
            <Chip
              key={t ?? 'all'}
              label={t ?? 'All'}
              size="small"
              onClick={() => setTag(t)}
              sx={{
                flexShrink: 0,
                borderRadius: 1,
                color: '#fff',
                bgcolor: tag === t ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)',
                ...(tag === t && { color: '#000', fontWeight: 700 }),
              }}
            />
          ))}
        </Stack>

        {loading ? (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress sx={{ color: '#fff' }} size={28} />
          </Box>
        ) : error ? (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="#fff" variant="body2">
              Couldn't load the scroll feed.
            </Typography>
            <Chip label="Retry" onClick={() => void load(tag)} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.15)' }} />
          </Box>
        ) : queue.length === 0 ? (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 4 }}>
            <Typography color="#fff" variant="body2" sx={{ textAlign: 'center' }}>
              {tag ? `No snips tagged "${tag}" yet.` : 'No snips yet. Be the first to share something.'}
            </Typography>
          </Box>
        ) : (
          <Box
            ref={containerRef}
            onScroll={handleScroll}
            sx={{
              height: '100%',
              overflowY: 'auto',
              scrollSnapType: 'y mandatory',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            {queue.map((item, i) => (
              <ScrollSlide
                key={item.key}
                snip={item.snip}
                active={i === activeIndex}
                isNearActive={Math.abs(i - activeIndex) <= 2}
                muted={muted}
                onToggleMute={onToggleMute}
                onOpenComments={setCommentSnip}
              />
            ))}
          </Box>
        )}
      </Box>

      <CommentDrawer open={commentSnip !== null} snipId={commentSnip?.id ?? null} onClose={() => setCommentSnip(null)} />
    </Box>
  )
}
