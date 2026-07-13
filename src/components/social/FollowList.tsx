import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { useAuth } from '../../context/AuthContext'
import type { UserPage, UserProfile } from '../../types'
import { FollowButton } from './FollowButton'

interface FollowListProps {
  title: string
  fetchPage: (cursor?: string) => Promise<UserPage>
}

/** Renders a paginated list of profiles — shared by the Followers and
 * Following pages, which differ only in which endpoint they call. */
export function FollowList({ title, fetchPage }: FollowListProps) {
  const navigate = useNavigate()
  const { profile: myProfile } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const page = await fetchPage()
      setUsers(page.users ?? [])
      setCursor(page.nextCursor)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPage])

  useEffect(() => {
    void load()
  }, [load])

  const loadMore = async () => {
    if (!cursor) return
    setLoadingMore(true)
    try {
      const page = await fetchPage(cursor)
      setUsers((prev) => [...prev, ...(page.users ?? [])])
      setCursor(page.nextCursor)
    } catch {
      setError(true)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        {title}
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Couldn't load this list.
          </Typography>
          <Button size="small" onClick={() => void load()}>
            Retry
          </Button>
        </Box>
      ) : users.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          Nobody here yet.
        </Typography>
      ) : (
        <>
          {users.map((u) => (
            <Stack
              key={u.uid}
              direction="row"
              spacing={1.5}
              sx={{ alignItems: 'center', py: 1.5, borderBottom: 1, borderColor: 'divider', cursor: 'pointer' }}
              onClick={() => navigate(`/${u.username}`)}
            >
              <Avatar src={u.photoUrl} sx={{ width: 40, height: 40 }}>
                {u.displayName?.[0]?.toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700 }}>
                  {u.displayName}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  @{u.username}
                </Typography>
              </Box>
              {myProfile && myProfile.uid !== u.uid && (
                <Box onClick={(e) => e.stopPropagation()}>
                  <FollowButton username={u.username} initialFollowing={u.isFollowedByMe} />
                </Box>
              )}
            </Stack>
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
