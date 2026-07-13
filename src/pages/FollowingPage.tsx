import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { FollowList } from '../components/social/FollowList'
import { listFollowing } from '../api/followApi'

export function FollowingPage() {
  const { username } = useParams<{ username: string }>()
  const fetchPage = useCallback((cursor?: string) => listFollowing(username!, cursor), [username])
  return <FollowList title="Following" fetchPage={fetchPage} />
}
