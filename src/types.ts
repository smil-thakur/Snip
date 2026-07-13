// Shared shapes mirroring the Go backend's JSON responses.

export interface UserProfile {
  uid: string
  username: string
  displayName: string
  bio: string
  photoUrl: string
  createdAt: string
  followersCount: number
  followingCount: number
  snipsCount: number
  isFollowedByMe: boolean
}

export interface Snip {
  id: string
  authorUid: string
  authorUsername: string
  authorName: string
  authorPhotoUrl: string
  contentDelta: unknown
  contentHtml: string
  contentText: string
  createdAt: string
  updatedAt: string
  edited: boolean
  likeCount: number
  commentCount: number
  likedByMe: boolean
  tags: string[]
}

export interface Comment {
  id: string
  snipId: string
  parentId: string
  authorUid: string
  authorUsername: string
  authorName: string
  authorPhotoUrl: string
  text: string
  createdAt: string
  replies: Comment[]
}

export interface SnipPage {
  snips: Snip[]
  nextCursor?: string
}

export interface UserPage {
  users: UserProfile[]
  nextCursor?: string
}

export interface SessionResult {
  profile: UserProfile
  isNewUser: boolean
  needsUsername: boolean
}
