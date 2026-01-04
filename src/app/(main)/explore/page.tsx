'use client'

import * as React from 'react'
import { PostCard } from '@/components/feed/PostCard'
import { getAllPosts } from '@/lib/api'
import { Post } from '@/types'
import { PostCardSkeleton } from '@/components/feed/PostCardSkeleton'
import { Loader2 } from 'lucide-react'

const POSTS_PER_PAGE = 10

export default function ExplorePage() {
  const [posts, setPosts] = React.useState<Post[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(true)

  const loadMoreRef = React.useRef<HTMLDivElement>(null)

  const loadPosts = React.useCallback(
    async (pageNum: number, append = false) => {
      if (pageNum === 1) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      try {
        const response = await getAllPosts(pageNum, POSTS_PER_PAGE)
        if (append) {
          setPosts((prev) => [...prev, ...response.posts])
        } else {
          setPosts(response.posts)
        }
        setHasMore(response.hasMore)
        setPage(pageNum)
      } catch (error) {
        console.error('Failed to fetch posts:', error)
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    []
  )

  React.useEffect(() => {
    loadPosts(1)
  }, [loadPosts])

  React.useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isLoading || isLoadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadPosts(page + 1, true)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loadMoreRef.current)

    return () => observer.disconnect()
  }, [hasMore, isLoading, isLoadingMore, page, loadPosts])

  const handlePostDeleted = (postId: string) => {
    setPosts((prevPosts) => prevPosts.filter((p) => p._id !== postId))
  }

  return (
    <div className='space-y-6'>
      <h1 className='text-3xl font-bold'>Explore</h1>
      <p className='text-muted-foreground'>
        See the latest thoughts from the community.
      </p>
      <div className='space-y-6'>
        {isLoading ? (
          <>
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </>
        ) : (
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
                <Loader2 className='w-6 h-6 animate-spin text-gray-400' />
              )}
              {!hasMore && posts.length > 0 && (
                <p className='text-sm text-gray-400'>You&apos;ve reached the end</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
