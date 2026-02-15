'use client'

import { useState, useEffect } from 'react'
import { Activity } from 'lucide-react'

interface ServerHealth {
  status: string
  model: string
  active_tasks: number
  queued_tasks: number
  max_concurrent_tasks: number
}

export function ServerStatusWidget() {
  const [health, setHealth] = useState<ServerHealth | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/health')
        if (!res.ok) throw new Error()
        const data = await res.json()
        setHealth(data)
        setError(false)
      } catch {
        setHealth(null)
        setError(true)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const isOnline = !error && health?.status === 'ok'

  return (
    <div className='bg-card p-4 rounded-2xl shadow-sm border border-border'>
      <div className='flex items-center gap-2 mb-3'>
        <Activity className='h-5 w-5 text-card-foreground' />
        <h3 className='font-bold text-lg text-card-foreground'>
          Server Status
        </h3>
      </div>

      <div className='space-y-3'>
        {/* Status indicator */}
        <div className='flex items-center gap-2'>
          <span
            className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
          />
          <span className='text-sm text-card-foreground'>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {isOnline && health && (
          <>
            {/* Model badge */}
            <div>
              <span className='inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground'>
                {health.model}
              </span>
            </div>

            {/* Task stats */}
            <div className='flex gap-4 text-sm'>
              <div>
                <span className='text-muted-foreground'>Active: </span>
                <span className='font-medium text-card-foreground'>
                  {health.active_tasks}/{health.max_concurrent_tasks}
                </span>
              </div>
              <div>
                <span className='text-muted-foreground'>Queued: </span>
                <span className='font-medium text-card-foreground'>
                  {health.queued_tasks}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
