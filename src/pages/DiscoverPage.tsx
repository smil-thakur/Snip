import { useCallback, useEffect, useState, type ReactElement } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { SnipCard } from '../components/snip/SnipCard'
import { SnipSearchPanel } from '../components/snip/SnipSearchPanel'
import { getDiscoverFeed, getFollowingFeed } from '../api/feedApi'
import type { Snip, SnipPage } from '../types'

type DiscoverTab = 'recent' | 'top' | 'following' | 'search'

const TAB_ICONS: Record<DiscoverTab, ReactElement> = {
  recent: <ScheduleRoundedIcon fontSize="small" />,
  top: <TrendingUpRoundedIcon fontSize="small" />,
  following: <GroupsRoundedIcon fontSize="small" />,
  search: <SearchRoundedIcon fontSize="small" />,
}

function fetchTab(tab: DiscoverTab, cursor?: string): Promise<SnipPage> {
  switch (tab) {
    case 'top':
      return getDiscoverFeed('top', cursor)
    case 'following':
      return getFollowingFeed(cursor)
    default:
      return getDiscoverFeed('recent', cursor)
  }
}

/** Discover: every public snip (Recent/Top), snips from people you follow,
 * or a dedicated tag/text Search panel. On narrow viewports the tab row
 * (which otherwise overflows/clips) is replaced with an icon-only bottom
 * navigation bar. */
export function DiscoverPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = (searchParams.get('tab') as DiscoverTab | null) ?? 'recent'
  const [tab, setTab] = useState<DiscoverTab>(initialTab)
  const [snips, setSnips] = useState<Snip[]>([])
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)

  const load = useCallback(async (activeTab: DiscoverTab) => {
    if (activeTab === 'search') return
    setLoading(true)
    setError(false)
    try {
      const page = await fetchTab(activeTab)
      setSnips(page.snips ?? [])
      setCursor(page.nextCursor)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(tab)
  }, [tab, load])

  const loadMore = async () => {
    if (!cursor || tab === 'search') return
    setLoadingMore(true)
    try {
      const page = await fetchTab(tab, cursor)
      setSnips((prev) => [...prev, ...(page.snips ?? [])])
      setCursor(page.nextCursor)
    } catch {
      setError(true)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleTabChange = (next: DiscoverTab) => {
    setTab(next)
    setSearchParams(next === 'recent' ? {} : { tab: next })
  }

  return (
    <Box sx={{ pb: isMobile ? 8 : 0 }}>
      {isMobile ? (
        <BottomNavigation
          value={tab}
          onChange={(_, v: DiscoverTab) => handleTabChange(v)}
          showLabels={false}
          sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: (t) => t.zIndex.appBar,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          {(['recent', 'top', 'following', 'search'] as const).map((t) => (
            <BottomNavigationAction key={t} value={t} icon={TAB_ICONS[t]} aria-label={t} />
          ))}
        </BottomNavigation>
      ) : (
        <Tabs value={tab} onChange={(_, v: DiscoverTab) => handleTabChange(v)} sx={{ mb: 2, minHeight: 36 }}>
          <Tab value="recent" label="Recent" sx={{ minHeight: 36 }} />
          <Tab value="top" label="Top" sx={{ minHeight: 36 }} />
          <Tab value="following" label="Following" sx={{ minHeight: 36 }} />
          <Tab value="search" label="Search" sx={{ minHeight: 36 }} />
        </Tabs>
      )}

      {tab === 'search' ? (
        <SnipSearchPanel />
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Couldn't load Discover.
          </Typography>
          <Button size="small" onClick={() => void load(tab)}>
            Retry
          </Button>
        </Box>
      ) : snips.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          {tab === 'following' ? "Nobody you follow has posted yet." : 'No snips yet. Be the first to share something.'}
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
