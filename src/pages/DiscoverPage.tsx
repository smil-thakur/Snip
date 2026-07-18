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
import { RefreshPill } from '../components/common/RefreshPill'
import { useCachedFeed } from '../hooks/useCachedFeed'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { getDiscoverFeed, getFollowingFeed } from '../api/feedApi'
import type { Snip, SnipPage } from '../types'

type DiscoverTab = 'recent' | 'top' | 'following' | 'search'
type ListTab = Exclude<DiscoverTab, 'search'>

const TAB_ICONS: Record<DiscoverTab, ReactElement> = {
  recent: <ScheduleRoundedIcon fontSize="small" />,
  top: <TrendingUpRoundedIcon fontSize="small" />,
  following: <GroupsRoundedIcon fontSize="small" />,
  search: <SearchRoundedIcon fontSize="small" />,
}

function fetchTab(tab: ListTab, cursor?: string): Promise<SnipPage> {
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
 * navigation bar.
 *
 * The three list tabs (not Search, which is query-driven) are each backed
 * by useCachedFeed: switching tabs shows the previously-fetched list
 * instantly, and a background poll surfaces fresher content via a pill
 * instead of silently swapping the list underneath the viewer. */
export function DiscoverPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = (searchParams.get('tab') as DiscoverTab | null) ?? 'recent'
  const [tab, setTab] = useState<DiscoverTab>(initialTab)

  // Stays on the last real list tab while Search is active, so the cache
  // hook below keeps a stable key/fetcher (and keeps quietly polling that
  // tab in the background) instead of needing to special-case "search".
  const [lastListTab, setLastListTab] = useState<ListTab>(initialTab === 'search' ? 'recent' : initialTab)
  useEffect(() => {
    if (tab !== 'search') setLastListTab(tab)
  }, [tab])

  const fetchPage = useCallback((cursor?: string) => fetchTab(lastListTab, cursor), [lastListTab])
  const { snips, cursor, loading, loadingMore, error, hasNewContent, retry, loadMore, applyPending, mutateSnips } = useCachedFeed(
    `discover:${lastListTab}`,
    fetchPage,
  )

  usePullToRefresh(() => void applyPending(), tab !== 'search')

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
      ) : (
        <>
          {hasNewContent && <RefreshPill onClick={() => void applyPending()} />}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : error ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Couldn't load Discover.
              </Typography>
              <Button size="small" onClick={retry}>
                Retry
              </Button>
            </Box>
          ) : snips.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              {tab === 'following' ? "Nobody you follow has posted yet." : 'No snips yet. Be the first to share something.'}
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
        </>
      )}
    </Box>
  )
}
