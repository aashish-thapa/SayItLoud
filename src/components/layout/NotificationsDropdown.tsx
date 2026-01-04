'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/lib/api'
import { Notification as NotificationType } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { Heart, MessageCircle, UserPlus, CheckCheck } from 'lucide-react'

function NotificationIcon({ type }: { type: NotificationType['type'] }) {
  if (type === 'like')
    return <Heart className='w-5 h-5 text-red-500 fill-current' />
  if (type === 'comment')
    return <MessageCircle className='w-5 h-5 text-blue-500' />
  if (type === 'follow') return <UserPlus className='w-5 h-5 text-green-500' />
  return null
}

export function NotificationsDropdown({
  onClose,
  setUnreadCount,
}: {
  onClose: () => void
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>
}) {
  const [notifications, setNotifications] = React.useState<NotificationType[]>(
    []
  )
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadNotifications() {
      setIsLoading(true)
      try {
        const response = await getNotifications(1, 20)
        setNotifications(response.notifications)
        setUnreadCount(response.notifications.filter((n) => !n.read).length)
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadNotifications()
  }, [setUnreadCount])

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    )
    setUnreadCount((prevCount) => Math.max(0, prevCount - 1))
    try {
      await markNotificationAsRead(id)
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      // Optionally revert state on error
    }
  }

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    try {
      await markAllNotificationsAsRead()
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
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

    return (
      <Link href={href} onClick={onClose}>
        {children}
      </Link>
    )
  }

  return (
    <div className='absolute top-full right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-lg border z-50'>
      <div className='p-4 flex items-center justify-between border-b'>
        <h3 className='font-bold text-lg'>Notifications</h3>
        <Button
          variant='link'
          size='sm'
          className='text-sm p-0 h-auto'
          onClick={handleMarkAllAsRead}
          disabled={notifications.every((n) => n.read)}
        >
          <CheckCheck className='w-4 h-4 mr-1.5' />
          Mark all as read
        </Button>
      </div>

      <ScrollArea className='h-[400px]'>
        {isLoading ? (
          <p className='p-4 text-center text-muted-foreground'>Loading...</p>
        ) : notifications.length === 0 ? (
          <p className='p-4 text-center text-muted-foreground'>
            No notifications yet.
          </p>
        ) : (
          <div className='divide-y'>
            {notifications.map((n) => (
              <NotificationLink key={n._id} notification={n}>
                <div
                  className={cn(
                    'p-3 flex items-start gap-4 hover:bg-gray-50',
                    !n.read && 'bg-primary/5'
                  )}
                  onClick={() => !n.read && handleMarkAsRead(n._id)}
                >
                  <div className='mt-1'>
                    <NotificationIcon type={n.type} />
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm'>
                      <span className='font-bold'>{n.initiator.username}</span>{' '}
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
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
