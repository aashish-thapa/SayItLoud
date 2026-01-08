'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { useAuth } from '@/contexts/AuthContext'
import { login } from '@/lib/api'
import { ArrowRight } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const { login: authLogin } = useAuth()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const user = await login(formData)
      authLogin(user)
      router.push('/explore')
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('An unknown error occurred.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className='grid gap-6'
    >
      {error && <p className='text-destructive text-sm text-center'>{error}</p>}

      <div className='grid gap-2'>
        <Label htmlFor='email'>Email</Label>
        <Input
          name='email'
          id='email'
          type='email'
          value={formData.email}
          onChange={handleChange}
          placeholder='name@example.com'
        />
      </div>

      <div className='grid gap-2'>
        <Label htmlFor='password'>Password</Label>
        <Input
          name='password'
          id='password'
          type='password'
          value={formData.password}
          onChange={handleChange}
          placeholder='••••••••'
        />
      </div>

      <Button type='submit' disabled={isLoading} className='mt-4'>
        {isLoading ? 'Signing in...' : 'Sign In'}
        {!isLoading && <ArrowRight className='h-4 w-4 ml-2' />}
      </Button>
    </motion.form>
  )
}
