'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { BrainCircuit, PenSquare, User, LogOut, Menu, Bell } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { Search } from './Search'
import { NotificationsDropdown } from './NotificationsDropdown'
import { getNotifications } from '@/lib/api'
import Image from 'next/image'
import { MobileMenu } from './MobileMenu'

export function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [showNotifications, setShowNotifications] = React.useState(false)
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  React.useEffect(() => {
    if (!user) return
    // Fetch initial notification count
    getNotifications(1, 50)
      .then((data) => {
        setUnreadCount(data.notifications.filter((n) => !n.read).length)
      })
      .catch((err) =>
        console.error('Failed to fetch initial notification count:', err)
      )
  }, [user])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <>
      <header className='sticky top-0 z-40 w-full border-b bg-white'>
        <div className='container mx-auto flex h-16 items-center'>
          {/* Left Section */}
          <div className='flex items-center gap-6'>
            <Link href='/feed' className='flex items-center gap-2'>
              <BrainCircuit className='h-7 w-7 text-primary' />
              <span className='hidden sm:inline-block font-bold text-lg'>
                SayItLoud
              </span>
            </Link>
          </div>

          {/* Center Section - Search */}
          <div className='flex-1 flex justify-center px-4 lg:px-8'>
            <Search />
          </div>

          {/* Right Section */}
          <div className='flex items-center gap-3'>
            <Button className='hidden sm:flex items-center gap-2'>
              <PenSquare className='w-5 h-5' />
              <span>Post</span>
            </Button>

            {user ? (
              <>
                <div className='relative'>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='rounded-full'
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <Bell className='h-6 w-6' />
                    {unreadCount > 0 && (
                      <span className='absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white' />
                    )}
                    <span className='sr-only'>View notifications</span>
                  </Button>
                  {showNotifications && (
                    <NotificationsDropdown
                      onClose={() => setShowNotifications(false)}
                      setUnreadCount={setUnreadCount}
                    />
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      className='w-10 h-10 rounded-full p-0'
                    >
                      <div className='w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg relative overflow-hidden'>
                        {user.profilePicture ? (
                          <Image
                            src={user.profilePicture}
                            alt={user.username}
                            layout='fill'
                            objectFit='cover'
                          />
                        ) : (
                          user.username.charAt(0).toUpperCase()
                        )}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className='w-56 bg-white' align='end'>
                    <DropdownMenuLabel>
                      <p className='font-bold'>{user.username}</p>
                      <p className='text-xs text-muted-foreground font-normal'>
                        @{user.username}
                      </p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => router.push(`/profile/${user.username}`)}
                    >
                      <User className='mr-2 h-4 w-4' />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleLogout}>
                      <LogOut className='mr-2 h-4 w-4' />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href='/login'>
                  <Button variant='ghost'>Login</Button>
                </Link>
                <Link href='/signup'>
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}

            {/* Mobile Menu - could be used to toggle sidebars in the future */}
            <Button
              variant='ghost'
              size='icon'
              className='md:hidden'
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className='h-6 w-6' />
              <span className='sr-only'>Toggle menu</span>
            </Button>
          </div>
        </div>
      </header>
      {isMobileMenuOpen && (
        <MobileMenu onClose={() => setIsMobileMenuOpen(false)} />
      )}
    </>
  )
}
