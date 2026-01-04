'use client'

import * as React from 'react'
import { getFeed, deletePost } from '@/lib/api'
import { Post } from '@/types'
import { PostCard } from '@/components/feed/PostCard'
import { CreatePostForm } from '@/components/feed/CreatePostForm'
import { PostCardSkeleton } from '@/components/feed/PostCardSkeleton'
import { Frown, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const POSTS_PER_PAGE = 10

export default function FeedPage() {
  const { user } = useAuth()
  const [posts, setPosts] = React.useState<Post[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [page, setPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(true)

  const loadMoreRef = React.useRef<HTMLDivElement>(null)

  const loadFeed = React.useCallback(
    async (pageNum: number, append = false) => {
      if (pageNum === 1) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      try {
        const response = await getFeed(pageNum, POSTS_PER_PAGE)
        if (append) {
          setPosts((prev) => [...prev, ...response.posts])
        } else {
          setPosts(response.posts)
        }
        setHasMore(response.hasMore)
        setPage(pageNum)
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError('An unknown error occurred while fetching the feed.')
        }
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    []
  )

  React.useEffect(() => {
    loadFeed(1)
  }, [loadFeed])

  React.useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isLoading || isLoadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadFeed(page + 1, true)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loadMoreRef.current)

    return () => observer.disconnect()
  }, [hasMore, isLoading, isLoadingMore, page, loadFeed])

  const handlePostCreated = (newPost: Omit<Post, 'user'>) => {
    if (!user) return

    const postWithUser: Post = {
      ...newPost,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        followers: user.followers || [],
        following: user.following || [],
        createdAt: user.createdAt,
        userPreferences: user.userPreferences,
      },
    }
    setPosts([postWithUser, ...posts])
  }

  const handlePostDeleted = async (postId: string) => {
    setPosts(posts.filter((p) => p._id !== postId))

    try {
      await deletePost(postId)
    } catch (error) {
      console.error('Failed to delete post:', error)
    }
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className='space-y-6'>
          <PostCardSkeleton />
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      )
    }

    if (error) {
      return (
        <div className='bg-card rounded-2xl border border-border p-8 text-center'>
          <Frown className='w-16 h-16 mx-auto text-muted-foreground' />
          <h2 className='mt-4 text-xl font-bold text-card-foreground'>Could not load feed</h2>
          <p className='mt-2 text-muted-foreground'>{error}</p>
        </div>
      )
    }

    if (posts.length === 0) {
      return (
        <div className='bg-card rounded-2xl border border-border p-8 text-center'>
          <h2 className='mt-4 text-xl font-bold text-card-foreground'>The feed is quiet...</h2>
          <p className='mt-2 text-muted-foreground'>
            Be the first to post a thought!
          </p>
        </div>
      )
    }

    return (
      <div className='space-y-6'>
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
            <Loader2 className='w-6 h-6 animate-spin text-gray-400' />
          )}
          {!hasMore && posts.length > 0 && (
            <p className='text-sm text-gray-400'>You&apos;ve reached the end</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-8'>
      <CreatePostForm onPostCreated={handlePostCreated} />
      {renderContent()}
    </div>
  )
}
