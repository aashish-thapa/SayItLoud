'use client'

import * as React from 'react'
import { getPostById } from '@/lib/api'
import { Post, Comment as CommentType } from '@/types'
import { PostCard } from '@/components/feed/PostCard'
import { PostCardSkeleton } from '@/components/feed/PostCardSkeleton'
import { Frown } from 'lucide-react'
import { CommentForm } from '@/components/feed/CommentForm'
import { CommentList } from '@/components/feed/CommentList'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface PostClientProps {
  id: string
}

export default function PostClient({ id }: PostClientProps) {
  const [post, setPost] = React.useState<Post | null>(null)
  const [comments, setComments] = React.useState<CommentType[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadPost() {
      setIsLoading(true)
      try {
        const fetchedPost = await getPostById(id)
        setPost(fetchedPost)
        setComments(fetchedPost.comments.reverse())
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message)
        } else {
          setError('An unknown error occurred while fetching the post.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      loadPost()
    }
  }, [id])

  const handleCommentCreated = (newComment: CommentType) => {
    setComments((prevComments) => [newComment, ...prevComments])
    // Also update the comment count on the post object if needed
    if (post) {
      setPost({
        ...post,
        comments: [...post.comments, newComment],
      })
    }
  }

  const handlePostDeleted = () => {
    // Redirect user away after post deletion, maybe to the feed
    // This is a simplified handler. A more robust solution might use useRouter
    window.location.href = '/explore'
  }

  if (isLoading) {
    return <PostCardSkeleton />
  }

  if (error || !post) {
    return (
      <div className='bg-white rounded-2xl border border-gray-200/80 p-8 text-center'>
        <Frown className='w-16 h-16 mx-auto text-gray-300' />
        <h2 className='mt-4 text-xl font-bold'>Could not load post</h2>
        <p className='mt-2 text-muted-foreground'>
          {error || 'The post may have been deleted or does not exist.'}
        </p>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <Link
        href='/explore'
        className='flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4'
      >
        <ArrowLeft className='w-4 h-4' />
        Back to explore
      </Link>
      <PostCard post={post} onPostDeleted={handlePostDeleted} />
      <CommentForm postId={post._id} onCommentCreated={handleCommentCreated} />
      <CommentList comments={comments} />
    </div>
  )
}
