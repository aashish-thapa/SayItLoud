'use client'

import * as React from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import {
  Home,
  Compass,
  Bell,
  Mail,
  User,
  PenSquare,
  LogOut,
  X,
} from 'lucide-react'
import Image from 'next/image'

interface MobileMenuProps {
  onClose: () => void
  onPostClick?: () => void
}

export function MobileMenu({ onClose, onPostClick }: MobileMenuProps) {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    onClose()
  }

  const navItems = [
    { href: '/feed', label: 'Home', icon: Home },
    { href: '/explore', label: 'Explore', icon: Compass },
    { href: '/notifications', label: 'Notifications', icon: Bell },
    {
      href: '#',
      label: 'Messages',
      icon: Mail,
      onClick: () => alert('Feature coming soon!'),
    },
    {
      href: user ? `/profile/${user.username}` : '/login',
      label: 'Profile',
      icon: User,
    },
  ]

  return (
    <div className='fixed inset-0 z-50 bg-background p-4 md:hidden'>
      <div className='flex justify-between items-center mb-8'>
        <h2 className='font-bold text-lg'>Menu</h2>
        <Button variant='ghost' size='icon' onClick={onClose}>
          <X className='h-6 w-6' />
        </Button>
      </div>
      <div className='flex flex-col h-full'>
        {user ? (
          <>
            <div className='mb-6'>
              <Link
                href={`/profile/${user.username}`}
                className='block group'
                onClick={onClose}
              >
                <div className='flex items-center gap-3'>
                  <div className='w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl flex-shrink-0 relative overflow-hidden'>
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
                  <div>
                    <p className='font-bold group-hover:underline'>
                      {user.username}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      @{user.username}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
            <nav>
              <ul className='space-y-2'>
                {navItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={() => {
                        if (item.onClick) item.onClick()
                        onClose()
                      }}
                    >
                      <div className='flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors font-semibold text-lg'>
                        <item.icon className='w-6 h-6' />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className='mt-auto space-y-4'>
              <Button
                size='lg'
                className='w-full py-3 text-lg font-bold'
                onClick={() => {
                  onClose()
                  onPostClick?.()
                }}
              >
                <PenSquare className='w-5 h-5 mr-3' />
                Post
              </Button>
              <Button
                variant='outline'
                size='lg'
                className='w-full'
                onClick={handleLogout}
              >
                <LogOut className='w-5 h-5 mr-3' />
                Logout
              </Button>
            </div>
          </>
        ) : (
          <div className='flex flex-col items-center justify-center h-full'>
            <Link href='/login' onClick={onClose}>
              <Button className='w-full mb-4'>Login</Button>
            </Link>
            <Link href='/signup' onClick={onClose}>
              <Button variant='outline' className='w-full'>
                Sign Up
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
