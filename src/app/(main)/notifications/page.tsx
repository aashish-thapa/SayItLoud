'use client'

import * as React from 'react'
import { getNotifications, markNotificationAsRead } from '@/lib/api'
import { Notification as NotificationType } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Heart, MessageCircle, UserPlus, Bell, Loader2 } from 'lucide-react'

const NOTIFICATIONS_PER_PAGE = 20

function NotificationIcon({ type }: { type: NotificationType['type'] }) {
  if (type === 'like')
    return <Heart className='w-5 h-5 text-red-500 fill-current' />
  if (type === 'comment')
    return <MessageCircle className='w-5 h-5 text-blue-500' />
  if (type === 'follow') return <UserPlus className='w-5 h-5 text-green-500' />
  return null
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = React.useState<NotificationType[]>(
    []
  )
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(true)

  const loadMoreRef = React.useRef<HTMLDivElement>(null)

  const loadNotifications = React.useCallback(
    async (pageNum: number, append = false) => {
      if (pageNum === 1) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      try {
        const response = await getNotifications(pageNum, NOTIFICATIONS_PER_PAGE)
        if (append) {
          setNotifications((prev) => [...prev, ...response.notifications])
        } else {
          setNotifications(response.notifications)
        }
        setHasMore(response.hasMore)
        setPage(pageNum)
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    []
  )

  React.useEffect(() => {
    loadNotifications(1)
  }, [loadNotifications])

  React.useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isLoading || isLoadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadNotifications(page + 1, true)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loadMoreRef.current)

    return () => observer.disconnect()
  }, [hasMore, isLoading, isLoadingMore, page, loadNotifications])

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    )
    try {
      await markNotificationAsRead(id)
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const NotificationLink = ({
    notification,
    children,
  }: {
    notification: NotificationType
    children: React.ReactNode
  }) => {
    const href =
      notification.type === 'follow'
        ? `/profile/${notification.initiator.username}`
        : `/post/${notification.post?._id}`

    return <Link href={href}>{children}</Link>
  }

  return (
    <div className='space-y-6'>
      <h1 className='text-3xl font-bold'>Notifications</h1>
      <div className='bg-white rounded-2xl border'>
        {isLoading ? (
          <p className='p-6 text-center text-muted-foreground'>Loading...</p>
        ) : notifications.length === 0 ? (
          <div className='p-8 text-center'>
            <Bell className='w-16 h-16 mx-auto text-gray-300' />
            <h3 className='mt-4 text-xl font-bold'>No notifications yet</h3>
            <p className='mt-2 text-muted-foreground'>
              Likes, comments, and new followers will appear here.
            </p>
          </div>
        ) : (
          <>
            <ul className='divide-y'>
              {notifications.map((n) => (
                <li key={n._id}>
                  <NotificationLink notification={n}>
                    <div
                      className={cn(
                        'p-4 flex items-start gap-4 hover:bg-gray-50',
                        !n.read && 'bg-primary/5'
                      )}
                      onClick={() => !n.read && handleMarkAsRead(n._id)}
                    >
                      <div className='mt-1'>
                        <NotificationIcon type={n.type} />
                      </div>
                      <div className='flex-1'>
                        <p className='text-sm'>
                          <span className='font-bold'>
                            {n.initiator.username}
                          </span>{' '}
                          {n.message}
                        </p>
                        <p className='text-xs text-muted-foreground mt-0.5'>
                          {formatDistanceToNow(new Date(n.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {!n.read && (
                        <div className='w-2.5 h-2.5 rounded-full bg-primary mt-2 flex-shrink-0'></div>
                      )}
                    </div>
                  </NotificationLink>
                </li>
              ))}
            </ul>

            {/* Load more trigger */}
            <div ref={loadMoreRef} className='h-10 flex items-center justify-center'>
              {isLoadingMore && (
                <Loader2 className='w-6 h-6 animate-spin text-gray-400' />
              )}
              {!hasMore && notifications.length > 0 && (
                <p className='text-sm text-gray-400'>No more notifications</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
