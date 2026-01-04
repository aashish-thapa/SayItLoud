'use client'

import * as React from 'react'
import {
  getUserPosts,
  followUser,
  unfollowUser,
  getProfile,
  searchUsers,
  getUserById,
} from '@/lib/api'
import { Post, User } from '@/types'
import { PostCard } from '@/components/feed/PostCard'
import { Frown, CalendarDays, UserPlus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { PostCardSkeleton } from '@/components/feed/PostCardSkeleton'
import { FollowListModal } from '@/components/profile/FollowListModal'
import { EditProfileModal } from '@/components/modals/EditProfileModal'
import Image from 'next/image'

interface ProfileClientProps {
  username: string
}

const POSTS_PER_PAGE = 10

function ProfileHeaderSkeleton() {
  return (
    <div className='bg-card rounded-2xl p-6 shadow-sm border border-border animate-pulse'>
      <div className='flex items-center gap-6'>
        <div className='w-24 h-24 rounded-full bg-muted'></div>
        <div className='space-y-3'>
          <div className='h-6 bg-muted rounded w-48'></div>
          <div className='h-4 bg-muted rounded w-32'></div>
          <div className='h-4 bg-muted rounded w-40'></div>
        </div>
      </div>
      <div className='mt-4 flex items-center gap-6'>
        <div className='h-4 bg-muted rounded w-20'></div>
        <div className='h-4 bg-muted rounded w-20'></div>
      </div>
    </div>
  )
}

export default function ProfileClient({ username }: ProfileClientProps) {
  const { user: currentUser, updateUser } = useAuth()
  const [profile, setProfile] = React.useState<User | null>(null)
  const [posts, setPosts] = React.useState<Post[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoadingPosts, setIsLoadingPosts] = React.useState(false)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [page, setPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(true)
  const [modalContent, setModalContent] = React.useState<{
    title: string
    users: User['followers']
  } | null>(null)

  const loadMoreRef = React.useRef<HTMLDivElement>(null)

  const isFollowing = React.useMemo(() => {
    return currentUser?.following?.some((f) => f._id === profile?._id) ?? false
  }, [currentUser?.following, profile?._id])

  const loadPosts = React.useCallback(
    async (userId: string, pageNum: number, append = false) => {
      if (pageNum === 1) {
        setIsLoadingPosts(true)
      } else {
        setIsLoadingMore(true)
      }

      try {
        const response = await getUserPosts(userId, pageNum, POSTS_PER_PAGE)
        if (append) {
          setPosts((prev) => [...prev, ...response.posts])
        } else {
          setPosts(response.posts)
        }
        setHasMore(response.hasMore)
        setPage(pageNum)
      } catch (err) {
        console.error('Failed to load posts:', err)
      } finally {
        setIsLoadingPosts(false)
        setIsLoadingMore(false)
      }
    },
    []
  )

  React.useEffect(() => {
    async function loadProfile() {
      if (!username) return
      setIsLoading(true)
      setError(null)
      setPosts([])
      setPage(1)
      setHasMore(true)

      try {
        let profileData: User
        if (currentUser && currentUser.username === username) {
          profileData = await getProfile()
        } else {
          const users = await searchUsers(username)
          if (users.length === 0) {
            throw new Error('User not found.')
          }
          profileData = await getUserById(users[0]._id)
        }
        setProfile(profileData)
        await loadPosts(profileData._id, 1)
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message)
        } else {
          setError('An unknown error occurred while fetching the profile.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [username, currentUser, loadPosts])

  React.useEffect(() => {
    if (
      !loadMoreRef.current ||
      !hasMore ||
      isLoading ||
      isLoadingPosts ||
      isLoadingMore ||
      !profile
    )
      return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadPosts(profile._id, page + 1, true)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loadMoreRef.current)

    return () => observer.disconnect()
  }, [hasMore, isLoading, isLoadingPosts, isLoadingMore, page, profile, loadPosts])

  const handleFollowToggle = async () => {
    if (!currentUser || !profile) return

    try {
      if (isFollowing) {
        await unfollowUser(profile._id)
      } else {
        await followUser(profile._id)
      }
      const updatedUser = await getProfile()
      updateUser(updatedUser)
    } catch (err) {
      console.error('Failed to toggle follow state:', err)
    }
  }

  const handlePostDeleted = (postId: string) => {
    setPosts(posts.filter((p) => p._id !== postId))
  }

  const isOwnProfile = currentUser?._id === profile?._id

  const handleProfileUpdate = (updatedUser: User) => {
    setProfile((prev) => ({
      ...prev,
      ...updatedUser,
    }))
  }

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <ProfileHeaderSkeleton />
        <PostCardSkeleton />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className='bg-card rounded-2xl border border-border p-8 text-center'>
        <Frown className='w-16 h-16 mx-auto text-muted-foreground' />
        <h2 className='mt-4 text-xl font-bold text-card-foreground'>Could not load profile</h2>
        <p className='mt-2 text-muted-foreground'>
          {error || 'This user may not exist.'}
        </p>
      </div>
    )
  }

  return (
    <div className='space-y-8'>
      {/* Profile Header */}
      <div className='bg-card rounded-2xl p-4 sm:p-6 shadow-sm border border-border'>
        <div className='flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6'>
          <div className='w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-5xl relative overflow-hidden flex-shrink-0 mx-auto sm:mx-0'>
            {profile.profilePicture ? (
              <Image
                src={profile.profilePicture}
                alt={profile.username}
                layout='fill'
                objectFit='cover'
              />
            ) : (
              profile.username.charAt(0).toUpperCase()
            )}
          </div>
          <div className='flex-1 text-center sm:text-left'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <h2 className='text-2xl font-bold text-card-foreground'>{profile.username}</h2>
                <p className='text-muted-foreground'>@{profile.username}</p>
              </div>
              <div className='mt-4 sm:mt-0'>
                {isOwnProfile ? (
                  <EditProfileModal onProfileUpdate={handleProfileUpdate}>
                    <Button variant='outline' className='w-full sm:w-auto'>
                      Edit Profile
                    </Button>
                  </EditProfileModal>
                ) : (
                  <Button
                    onClick={handleFollowToggle}
                    className='w-full sm:w-auto'
                  >
                    <UserPlus className='w-4 h-4 mr-2' />
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </Button>
                )}
              </div>
            </div>
            <div className='mt-4 flex items-center justify-center sm:justify-start gap-2 text-sm text-muted-foreground'>
              <CalendarDays className='w-4 h-4' />
            </div>
          </div>
        </div>
        <div className='mt-6 pt-6 border-t border-border flex items-center justify-center sm:justify-start gap-6 text-sm text-card-foreground'>
          <button
            className='hover:underline'
            onClick={() =>
              setModalContent({
                title: 'Following',
                users: profile.following,
              })
            }
          >
            <span className='font-bold'>{profile.following?.length || 0}</span>{' '}
            Following
          </button>
          <button
            className='hover:underline'
            onClick={() =>
              setModalContent({
                title: 'Followers',
                users: profile.followers,
              })
            }
          >
            <span className='font-bold'>{profile.followers?.length || 0}</span>{' '}
            Followers
          </button>
        </div>
      </div>

      {/* User's Posts */}
      <h3 className='text-xl font-bold'>Posts</h3>
      <div className='space-y-6'>
        {isLoadingPosts ? (
          <>
            <PostCardSkeleton />
            <PostCardSkeleton />
          </>
        ) : posts.length > 0 ? (
          <>
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onPostDeleted={handlePostDeleted}
              />
            ))}

            {/* Load more trigger */}
            <div ref={loadMoreRef} className='h-10 flex items-center justify-center'>
              {isLoadingMore && (
                <Loader2 className='w-6 h-6 animate-spin text-muted-foreground' />
              )}
              {!hasMore && posts.length > 0 && (
                <p className='text-sm text-muted-foreground'>No more posts</p>
              )}
            </div>
          </>
        ) : (
          <div className='bg-card rounded-2xl border border-border p-8 text-center'>
            <p className='text-muted-foreground font-medium'>
              This user hasn&apos;t posted anything yet.
            </p>
          </div>
        )}
      </div>
      {modalContent && (
        <FollowListModal
          title={modalContent.title}
          users={modalContent.users}
          onClose={() => setModalContent(null)}
        />
      )}
    </div>
  )
}
