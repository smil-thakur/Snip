import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { FollowList } from '../components/social/FollowList'
import { listFollowers } from '../api/followApi'

export function FollowersPage() {
  const { username } = useParams<{ username: string }>()
  const fetchPage = useCallback((cursor?: string) => listFollowers(username!, cursor), [username])
  return <FollowList title="Followers" fetchPage={fetchPage} />
}
