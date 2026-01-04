import { SignupForm } from '@/components/auth/SignupForm'
import Link from 'next/link'
import { BrainCircuit } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default function SignupPage() {
  return (
    <div className='flex items-center justify-center min-h-screen bg-background p-4'>
      <div className='absolute top-4 right-4'>
        <ThemeToggle />
      </div>
      <div className='w-full max-w-md space-y-8'>
        <div>
          <Link
            href='/'
            className='flex justify-center items-center gap-2 mb-6'
            prefetch={false}
          >
            <BrainCircuit className='h-8 w-8 text-foreground' />
            <span className='font-bold text-2xl text-foreground'>Second Brain</span>
          </Link>
          <h2 className='mt-6 text-center text-3xl font-bold tracking-tight text-foreground'>
            Create a new account
          </h2>
          <p className='mt-2 text-center text-sm text-muted-foreground'>
            Or{' '}
            <Link
              href='/login'
              className='font-medium text-primary hover:underline'
              prefetch={false}
            >
              sign in to your existing account
            </Link>
          </p>
        </div>
        <div className='bg-card p-8 rounded-2xl shadow-lg border border-border'>
          <SignupForm />
        </div>
      </div>
    </div>
  )
}
