import { useCallback, useEffect, useState } from 'react'
import { Box, Button, CircularProgress, Typography } from '@mui/material'
import { SnipComposer } from '../components/snip/SnipComposer'
import { SnipCard } from '../components/snip/SnipCard'
import { getHomeFeed } from '../api/feedApi'
import type { Snip } from '../types'

/** Home feed: your own snips plus everyone you follow, newest first. */
export function FeedPage() {
  const [snips, setSnips] = useState<Snip[]>([])
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const page = await getHomeFeed()
      setSnips(page.snips ?? [])
      setCursor(page.nextCursor)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const loadMore = async () => {
    if (!cursor) return
    setLoadingMore(true)
    try {
      const page = await getHomeFeed(cursor)
      setSnips((prev) => [...prev, ...(page.snips ?? [])])
      setCursor(page.nextCursor)
    } catch {
      setError(true)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <Box>
      <SnipComposer onPosted={(snip) => setSnips((prev) => [snip, ...prev])} />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : error && snips.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Couldn't load your feed.
          </Typography>
          <Button size="small" onClick={() => void load()}>
            Retry
          </Button>
        </Box>
      ) : snips.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          Nothing here yet — follow people on Discover, or post your first snip above.
        </Typography>
      ) : (
        <>
          {snips.map((snip) => (
            <SnipCard
              key={snip.id}
              snip={snip}
              onDeleted={(id) => setSnips((prev) => prev.filter((s) => s.id !== id))}
              onUpdated={(updated) => setSnips((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))}
            />
          ))}
          {cursor && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <Button onClick={loadMore} disabled={loadingMore} size="small">
                {loadingMore ? <CircularProgress size={16} /> : 'Load more'}
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  )
}
