import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Autocomplete, Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material'
import { SnipCard } from './SnipCard'
import { searchSnips } from '../../api/snipApi'
import { RECOMMENDED_TAGS } from '../../constants/tags'
import type { Snip } from '../../types'

const DEBOUNCE_MS = 400

/** Discover's Search sub-tab: free-text query plus tag filter chips. The
 * backend can only apply one array-contains-any filter per request, so
 * when tags are selected they take priority over the text query. */
export function SnipSearchPanel() {
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [tags, setTags] = useState<string[]>(() => {
    const initialTag = searchParams.get('tag')
    return initialTag ? [initialTag] : []
  })
  const [snips, setSnips] = useState<Snip[]>([])
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const runSearch = useCallback(async (q: string, activeTags: string[]) => {
    if (!q.trim() && activeTags.length === 0) {
      setSnips([])
      setCursor(undefined)
      setSearched(false)
      return
    }
    setLoading(true)
    setError(false)
    setSearched(true)
    try {
      const page = await searchSnips({ q, tags: activeTags })
      setSnips(page.snips ?? [])
      setCursor(page.nextCursor)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce the free-text query; tag changes trigger immediately below.
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void runSearch(query, tags)
    }, DEBOUNCE_MS)
    return () => clearTimeout(debounceRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, tags])

  const loadMore = async () => {
    if (!cursor) return
    setLoadingMore(true)
    try {
      const page = await searchSnips({ q: query, tags }, cursor)
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
      <Stack spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search snips…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Autocomplete
          multiple
          freeSolo
          size="small"
          options={RECOMMENDED_TAGS}
          value={tags}
          onChange={(_, newValue) => setTags(newValue.map((v) => v.trim()).filter(Boolean))}
          renderInput={(params) => <TextField {...params} placeholder="Filter by tag" />}
        />
        {query.trim() && tags.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            Searching by tag — the text query above is ignored while tags are selected.
          </Typography>
        )}
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Couldn't run that search.
          </Typography>
          <Button size="small" onClick={() => void runSearch(query, tags)}>
            Retry
          </Button>
        </Box>
      ) : !searched ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          Type a search term or pick a tag to get started.
        </Typography>
      ) : snips.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No matching snips.
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
