import { useCallback } from 'react'
import { Box, Button, CircularProgress, Typography } from '@mui/material'
import { SnipComposer } from '../components/snip/SnipComposer'
import { SnipCard } from '../components/snip/SnipCard'
import { RefreshPill } from '../components/common/RefreshPill'
import { useCachedFeed } from '../hooks/useCachedFeed'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { getHomeFeed } from '../api/feedApi'
import type { Snip } from '../types'

const CACHE_KEY = 'feed:home'

/** Home feed: your own snips plus everyone you follow, newest first.
 * Backed by useCachedFeed so revisiting this page (e.g. after a trip to
 * Discover) shows the previous list instantly instead of re-fetching and
 * re-mounting every image/video — a background poll then surfaces fresher
 * content via a pill instead of silently swapping the list underneath the
 * viewer. */
export function FeedPage() {
  const fetchPage = useCallback((cursor?: string) => getHomeFeed(cursor), [])
  const { snips, cursor, loading, loadingMore, error, hasNewContent, retry, loadMore, applyPending, mutateSnips } = useCachedFeed(
    CACHE_KEY,
    fetchPage,
  )

  usePullToRefresh(() => void applyPending(), true)

  return (
    <Box>
      {hasNewContent && <RefreshPill onClick={() => void applyPending()} />}

      <SnipComposer onPosted={(snip) => mutateSnips((prev) => [snip, ...prev])} />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : error && snips.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Couldn't load your feed.
          </Typography>
          <Button size="small" onClick={retry}>
            Retry
          </Button>
        </Box>
      ) : snips.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          Nothing here yet — follow people on Discover, or post your first snip above.
        </Typography>
      ) : (
        <>
          {snips.map((snip: Snip) => (
            <SnipCard
              key={snip.id}
              snip={snip}
              onDeleted={(id) => mutateSnips((prev) => prev.filter((s) => s.id !== id))}
              onUpdated={(updated) => mutateSnips((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))}
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
