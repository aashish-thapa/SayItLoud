'use client'

import { Post } from '@/types'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  MessageCircle,
  Heart,
  Share2,
  BarChart2,
  Trash2,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Info,
  Tag,
  FileText,
  X,
  Pin,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import * as React from 'react'
import { likePost, deletePost, pinPost } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import Image from 'next/image'

interface PostCardProps {
  post: Post
  onPostDeleted: (postId: string) => void
  onPostPinned?: (postId: string, isPinned: boolean) => void
}

function formatContent(text: string): React.ReactNode[] {
  if (!text) return []

  // Regex to match URLs or **bolded text**
  const regex = /(\*\*.*?\*\*|https?:\/\/[^\s]+)/g

  return text.split(regex).map((part, index) => {
    if (!part) return null

    // Check for bold
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.substring(2, part.length - 2)}</strong>
    }

    // Check for URL
    if (part.startsWith('http')) {
      return (
        <a
          key={index}
          href={part}
          target='_blank'
          rel='noopener noreferrer'
          className='text-primary hover:underline break-all'
        >
          {part}
        </a>
      )
    }

    return part
  })
}

export function PostCard({ post, onPostDeleted, onPostPinned }: PostCardProps) {
  const { user } = useAuth()

  const [likes, setLikes] = React.useState(post.likes.length)
  const [isLiked, setIsLiked] = React.useState(
    user ? post.likes.includes(user._id) : false
  )
  const [isLiking, setIsLiking] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isPinning, setIsPinning] = React.useState(false)
  const [isPinned, setIsPinned] = React.useState(post.isPinned)
  const [imageError, setImageError] = React.useState(false)
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [showFactCheckTooltip, setShowFactCheckTooltip] = React.useState(false)
  const [showSummaryTooltip, setShowSummaryTooltip] = React.useState(false)

  const handleLike = async () => {
    if (!user || isLiking) return
    setIsLiking(true)

    const originalLikes = likes
    const originalIsLiked = isLiked

    // Optimistic update
    setLikes(isLiked ? likes - 1 : likes + 1)
    setIsLiked(!isLiked)

    try {
      await likePost(post._id)
      // If the API call succeeds, the optimistic update was correct.
      // We don't need to do anything with the response.
    } catch (error) {
      console.error('Failed to like post:', error)
      // Revert on error
      setLikes(originalLikes)
      setIsLiked(originalIsLiked)
    } finally {
      setIsLiking(false)
    }
  }

  const isOwner = user && user._id === post.user._id

  const handleDelete = async () => {
    if (!isOwner) return

    // Here you would typically show a confirmation modal first
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this post?'
    )
    if (!confirmDelete) {
      return
    }

    setIsDeleting(true)
    try {
      await deletePost(post._id)
      onPostDeleted(post._id)
    } catch (error) {
      console.error('Failed to delete post on server:', error)
      // Optionally show an error to the user
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePin = async () => {
    if (!user?.isAdmin || isPinning) return

    setIsPinning(true)
    const originalIsPinned = isPinned

    // Optimistic update
    setIsPinned(!isPinned)

    try {
      const result = await pinPost(post._id)
      // Notify parent component
      if (onPostPinned) {
        onPostPinned(post._id, result.post.isPinned)
      }
    } catch (error) {
      console.error('Failed to pin/unpin post:', error)
      // Revert on error
      setIsPinned(originalIsPinned)
    } finally {
      setIsPinning(false)
    }
  }

  const isAdmin = user?.isAdmin === true
  const isToxic = post.aiAnalysis?.toxicity?.detected === true
  const isLongPost = post.content.length > 280
  const factCheck = post.aiAnalysis?.factCheck
  const factCheckReason = post.aiAnalysis?.factCheckReason
  const topics = post.aiAnalysis?.topics || []
  const summary = post.aiAnalysis?.summary
  const category = post.aiAnalysis?.category

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  // Close tooltips when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setShowFactCheckTooltip(false)
      setShowSummaryTooltip(false)
    }
    if (showFactCheckTooltip || showSummaryTooltip) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showFactCheckTooltip, showSummaryTooltip])

  return (
    <div
      className={cn(
        'bg-card rounded-2xl shadow-sm border border-border transition-all hover:shadow-md relative',
        isToxic && 'border-red-500/50',
        isPinned && 'border-primary/50 ring-1 ring-primary/20'
      )}
    >
      {isPinned && (
        <div className='absolute -top-3 -left-3 bg-primary text-primary-foreground p-2 rounded-full shadow-lg'>
          <Pin className='w-4 h-4' />
        </div>
      )}
      {isToxic && (
        <div className='absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full shadow-lg'>
          <ShieldAlert className='w-5 h-5' />
        </div>
      )}
      <div className='p-4 sm:p-5'>
        <div className='flex items-start gap-3 sm:gap-4'>
          <Link href={`/profile/${post.user.username}`}>
            <div className='w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg flex-shrink-0 relative overflow-hidden'>
              {post.user.profilePicture ? (
                <Image
                  src={post.user.profilePicture}
                  alt={post.user.username}
                  layout='fill'
                  objectFit='cover'
                />
              ) : (
                post.user.username.charAt(0).toUpperCase()
              )}
            </div>
          </Link>
          <div className='flex-1'>
            <div className='flex items-center justify-between'>
              <Link
                href={`/profile/${post.user.username}`}
                className='group flex-shrink'
              >
                <p className='font-bold group-hover:underline truncate text-card-foreground'>
                  {post.user.username}
                </p>
                <p className='text-sm text-muted-foreground truncate'>
                  @{post.user.username}
                </p>
              </Link>
              <p className='text-xs text-muted-foreground flex-shrink-0 ml-2'>
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <div className='mt-3 text-base text-card-foreground/90 whitespace-pre-wrap break-words'>
              {isLongPost && !isExpanded ? (
                <div>
                  {formatContent(post.content.substring(0, 280))}...
                  <button
                    onClick={toggleExpanded}
                    className='text-primary font-semibold hover:underline ml-1'
                  >
                    View more
                  </button>
                </div>
              ) : (
                <p>
                  {formatContent(post.content)}
                  {isLongPost && (
                    <button
                      onClick={toggleExpanded}
                      className='text-primary font-semibold hover:underline ml-1'
                    >
                      View less
                    </button>
                  )}
                </p>
              )}
            </div>
            {/* AI Topics */}
            {topics.length > 0 && (
              <div className='mt-3 flex flex-wrap gap-1.5'>
                {topics.slice(0, 5).map((topic, index) => (
                  <span
                    key={index}
                    className='inline-flex items-center gap-1 text-xs bg-primary/10 text-primary py-0.5 px-2 rounded-full'
                  >
                    <Tag className='w-3 h-3' />
                    {topic}
                  </span>
                ))}
              </div>
            )}
            {post.image && !imageError && (
              <div className='mt-4 relative overflow-hidden rounded-xl border border-border'>
                <Image
                  src={post.image}
                  alt='Post image'
                  width={800}
                  height={600}
                  className='w-full h-auto object-cover'
                  onError={() => setImageError(true)}
                />
              </div>
            )}
          </div>
        </div>
        <div className='mt-4 pl-12 sm:pl-16 flex flex-wrap justify-between items-center gap-y-2 text-muted-foreground'>
          <div className='flex items-center gap-4 sm:gap-6'>
            <Link
              href={`/post/${post._id}`}
              className='flex items-center gap-2 text-xs hover:text-primary transition-colors'
            >
              <MessageCircle className='w-4 h-4' /> {post.comments.length}
            </Link>
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={cn(
                'flex items-center gap-2 text-xs hover:text-rose-500 transition-colors',
                {
                  'text-rose-500': isLiked,
                }
              )}
            >
              <Heart className={cn('w-4 h-4', { 'fill-current': isLiked })} />{' '}
              {likes}
            </button>
            <button className='flex items-center gap-2 text-xs hover:text-green-500 transition-colors'>
              <Share2 className='w-4 h-4' />
              <span className='hidden sm:inline'>Share</span>
            </button>
          </div>
          <div className='flex items-center gap-2 sm:gap-3 flex-wrap'>
            {/* Summary tooltip - hover on desktop, click on mobile */}
            {summary && (
              <div className='relative group/summary'>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowSummaryTooltip(!showSummaryTooltip)
                    setShowFactCheckTooltip(false)
                  }}
                  className='text-xs flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors'
                >
                  <FileText className='w-3.5 h-3.5' />
                  <span className='hidden sm:inline'>Summary</span>
                </button>
                <div
                  className={cn(
                    'absolute bottom-full left-0 mb-2 w-72 p-3 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg border border-border transition-all duration-200 z-50',
                    showSummaryTooltip
                      ? 'opacity-100 visible'
                      : 'opacity-0 invisible sm:group-hover/summary:opacity-100 sm:group-hover/summary:visible'
                  )}
                >
                  <div className='flex items-center justify-between mb-2'>
                    <div className='font-semibold flex items-center gap-1.5'>
                      <FileText className='w-3.5 h-3.5' />
                      AI Summary
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowSummaryTooltip(false)
                      }}
                      className='sm:hidden p-0.5 hover:bg-muted rounded'
                    >
                      <X className='w-3.5 h-3.5' />
                    </button>
                  </div>
                  <p className='text-muted-foreground leading-relaxed'>{summary}</p>
                  <div className='absolute -bottom-1.5 left-4 w-3 h-3 bg-popover border-r border-b border-border rotate-45'></div>
                </div>
              </div>
            )}

            {/* Fact check badge - hover on desktop, click on mobile */}
            {factCheck && (
              <div className='relative group/factcheck'>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowFactCheckTooltip(!showFactCheckTooltip)
                    setShowSummaryTooltip(false)
                  }}
                  className={cn(
                    'text-xs flex items-center gap-1.5 py-1 px-2.5 rounded-full transition-colors',
                    {
                      'bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30': factCheck === 'support',
                      'bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30': factCheck === 'oppose',
                      'bg-muted text-muted-foreground hover:bg-muted/80': factCheck === 'neutral',
                    }
                  )}
                >
                  {factCheck === 'support' && <ThumbsUp className='w-3.5 h-3.5' />}
                  {factCheck === 'oppose' && <ThumbsDown className='w-3.5 h-3.5' />}
                  {factCheck === 'neutral' && <Minus className='w-3.5 h-3.5' />}
                  <span className='font-semibold capitalize'>{factCheck}</span>
                  {factCheckReason && <Info className='w-3 h-3 opacity-60' />}
                </button>
                {factCheckReason && (
                  <div
                    className={cn(
                      'absolute bottom-full right-0 mb-2 w-72 p-3 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg border border-border transition-all duration-200 z-50',
                      showFactCheckTooltip
                        ? 'opacity-100 visible'
                        : 'opacity-0 invisible sm:group-hover/factcheck:opacity-100 sm:group-hover/factcheck:visible'
                    )}
                  >
                    <div className='flex items-center justify-between mb-2'>
                      <div className='font-semibold capitalize flex items-center gap-1.5'>
                        {factCheck === 'support' && <ThumbsUp className='w-3.5 h-3.5 text-green-500' />}
                        {factCheck === 'oppose' && <ThumbsDown className='w-3.5 h-3.5 text-red-500' />}
                        {factCheck === 'neutral' && <Minus className='w-3.5 h-3.5' />}
                        {factCheck}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowFactCheckTooltip(false)
                        }}
                        className='sm:hidden p-0.5 hover:bg-muted rounded'
                      >
                        <X className='w-3.5 h-3.5' />
                      </button>
                    </div>
                    <p className='text-muted-foreground leading-relaxed'>{factCheckReason}</p>
                    <div className='absolute -bottom-1.5 right-4 w-3 h-3 bg-popover border-r border-b border-border rotate-45'></div>
                  </div>
                )}
              </div>
            )}

            {/* Category badge - now visible on mobile too */}
            {category && (
              <div className='text-xs flex items-center gap-1.5 bg-secondary text-secondary-foreground py-1 px-2.5 rounded-full'>
                <BarChart2 className='w-3.5 h-3.5' />
                <span className='hidden sm:inline'>{category}</span>
                <span className='sm:hidden'>{category.length > 10 ? category.substring(0, 8) + '...' : category}</span>
              </div>
            )}

            {/* Pin button (admin only) */}
            {isAdmin && (
              <Button
                onClick={handlePin}
                variant='ghost'
                size='icon'
                className={cn(
                  'w-8 h-8 text-muted-foreground hover:bg-primary/10 hover:text-primary',
                  isPinned && 'text-primary bg-primary/10'
                )}
                disabled={isPinning}
                title={isPinned ? 'Unpin post' : 'Pin post'}
              >
                <Pin className='w-4 h-4' />
              </Button>
            )}

            {/* Delete button */}
            {isOwner && (
              <Button
                onClick={handleDelete}
                variant='ghost'
                size='icon'
                className='w-8 h-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                disabled={isDeleting}
              >
                <Trash2 className='w-4 h-4' />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
