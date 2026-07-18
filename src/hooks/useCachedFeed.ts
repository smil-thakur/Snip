import { useCallback, useEffect, useRef, useState } from 'react'
import type { Snip, SnipPage } from '../types'

interface CacheEntry {
  snips: Snip[]
  cursor?: string
}

// Module-level, not component state — survives unmounts, so switching
// Feed -> Discover -> back (or any tab hop) shows the previous list
// instantly instead of re-fetching and re-mounting every video/image.
const cache = new Map<string, CacheEntry>()

const POLL_INTERVAL_MS = 45_000

/** Backs a single feed listing (Feed's home feed, or one Discover tab)
 * with a persistent cache plus a background poll: the visible list never
 * gets silently swapped out from under the viewer — a poll that finds
 * newer content just flips `hasNewContent`, and the caller decides how to
 * surface that (a "new snips" pill, pull-to-refresh, etc.) via applyPending. */
export function useCachedFeed(key: string, fetchPage: (cursor?: string) => Promise<SnipPage>) {
  const fetchPageRef = useRef(fetchPage)
  fetchPageRef.current = fetchPage

  const [snips, setSnips] = useState<Snip[]>(() => cache.get(key)?.snips ?? [])
  const [cursor, setCursor] = useState<string | undefined>(() => cache.get(key)?.cursor)
  const [loading, setLoading] = useState(() => !cache.has(key))
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)
  const [hasNewContent, setHasNewContent] = useState(false)
  const pendingRef = useRef<SnipPage | null>(null)

  const load = useCallback(async (activeKey: string) => {
    setLoading(true)
    setError(false)
    try {
      const page = await fetchPageRef.current()
      cache.set(activeKey, { snips: page.snips ?? [], cursor: page.nextCursor })
      setSnips(page.snips ?? [])
      setCursor(page.nextCursor)
      setHasNewContent(false)
      pendingRef.current = null
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  // Reset to the new key's cached state (instantly, if any) whenever the
  // caller switches feeds (e.g. a Discover tab change).
  useEffect(() => {
    const cached = cache.get(key)
    setSnips(cached?.snips ?? [])
    setCursor(cached?.cursor)
    setError(false)
    setHasNewContent(false)
    pendingRef.current = null
    if (cached) {
      setLoading(false)
    } else {
      void load(key)
    }
  }, [key, load])

  // Background poll for fresher content. Never touches visible state
  // directly — a failed or unchanged poll is silently ignored.
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const page = await fetchPageRef.current()
        const freshFirstId = page.snips?.[0]?.id
        const currentFirstId = cache.get(key)?.snips[0]?.id
        if (freshFirstId && freshFirstId !== currentFirstId) {
          pendingRef.current = page
          setHasNewContent(true)
        }
      } catch {
        // A background poll failing shouldn't disrupt the visible feed.
      }
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [key])

  const loadMore = useCallback(async () => {
    if (!cursor) return
    setLoadingMore(true)
    try {
      const page = await fetchPageRef.current(cursor)
      setSnips((prev) => {
        const next = [...prev, ...(page.snips ?? [])]
        cache.set(key, { snips: next, cursor: page.nextCursor })
        return next
      })
      setCursor(page.nextCursor)
    } catch {
      setError(true)
    } finally {
      setLoadingMore(false)
    }
  }, [key, cursor])

  // Applies whatever the last background poll found (or, if the pill/pull
  // was triggered without a poll result yet, just fetches fresh) and
  // scrolls the visible list back to the top of the feed.
  const applyPending = useCallback(async () => {
    if (pendingRef.current) {
      const page = pendingRef.current
      cache.set(key, { snips: page.snips ?? [], cursor: page.nextCursor })
      setSnips(page.snips ?? [])
      setCursor(page.nextCursor)
      pendingRef.current = null
      setHasNewContent(false)
    } else {
      await load(key)
    }
  }, [key, load])

  const mutateSnips = useCallback(
    (updater: (prev: Snip[]) => Snip[]) => {
      setSnips((prev) => {
        const next = updater(prev)
        cache.set(key, { snips: next, cursor: cache.get(key)?.cursor })
        return next
      })
    },
    [key],
  )

  return {
    snips,
    cursor,
    loading,
    loadingMore,
    error,
    hasNewContent,
    retry: () => load(key),
    loadMore,
    applyPending,
    mutateSnips,
  }
}
