'use client'

import * as React from 'react'
import { PostCard } from '@/components/feed/PostCard'
import { getAllPosts } from '@/lib/api'
import { Post } from '@/types'
import { PostCardSkeleton } from '@/components/feed/PostCardSkeleton'
import { Loader2, Clock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const POSTS_PER_PAGE = 10

type SortOption = 'recent' | 'discover'

export default function ExplorePage() {
  const [posts, setPosts] = React.useState<Post[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(true)
  const [sortBy, setSortBy] = React.useState<SortOption>('recent')

  const loadMoreRef = React.useRef<HTMLDivElement>(null)

  const loadPosts = React.useCallback(
    async (pageNum: number, sort: SortOption, append = false) => {
      if (pageNum === 1) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      try {
        const response = await getAllPosts(pageNum, POSTS_PER_PAGE, sort)
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
    loadPosts(1, sortBy)
  }, [loadPosts, sortBy])

  const handleSortChange = (newSort: SortOption) => {
    if (newSort !== sortBy) {
      setSortBy(newSort)
      setPage(1)
      setPosts([])
    }
  }

  React.useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isLoading || isLoadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadPosts(page + 1, sortBy, true)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loadMoreRef.current)

    return () => observer.disconnect()
  }, [hasMore, isLoading, isLoadingMore, page, sortBy, loadPosts])

  const handlePostDeleted = (postId: string) => {
    setPosts((prevPosts) => prevPosts.filter((p) => p._id !== postId))
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Explore</h1>
          <p className='text-muted-foreground'>
            See the latest thoughts from the community.
          </p>
        </div>
      </div>

      {/* Sort Filter Tabs */}
      <div className='flex gap-2 border-b border-border pb-2'>
        <button
          onClick={() => handleSortChange('recent')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            sortBy === 'recent'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'
          )}
        >
          <Clock className='w-4 h-4' />
          Recent
        </button>
        <button
          onClick={() => handleSortChange('discover')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            sortBy === 'discover'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'
          )}
        >
          <Sparkles className='w-4 h-4' />
          Discover
        </button>
      </div>

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
