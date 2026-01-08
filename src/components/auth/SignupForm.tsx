'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { useAuth } from '@/contexts/AuthContext'
import { signup } from '@/lib/api'
import { ArrowRight, ArrowLeft } from 'lucide-react'

export function SignupForm() {
  const router = useRouter()
  const { login: authLogin } = useAuth()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string | null>(null)

  const [step, setStep] = React.useState(0)
  const [formData, setFormData] = React.useState({
    username: '',
    email: '',
    password: '',
  })

  const handleNext = () => setStep(step + 1)
  const handlePrev = () => setStep(step - 1)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault()
    if (step < 2) {
      handleNext()
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const user = await signup(formData)
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

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  }

  return (
    <div className='overflow-hidden relative h-[250px]'>
      <AnimatePresence initial={false} custom={1}>
        <motion.form
          key={step}
          custom={1}
          variants={variants}
          initial='enter'
          animate='center'
          exit='exit'
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          onSubmit={handleSubmit}
          className='grid gap-6 absolute w-full'
        >
          {error && (
            <p className='text-destructive text-sm text-center'>{error}</p>
          )}

          {step === 0 && (
            <div className='grid gap-2'>
              <Label htmlFor='username'>Choose a username</Label>
              <Input
                name='username'
                id='username'
                value={formData.username}
                onChange={handleChange}
                placeholder='socrates'
              />
            </div>
          )}

          {step === 1 && (
            <div className='grid gap-2'>
              <Label htmlFor='email'>Your email address</Label>
              <Input
                name='email'
                id='email'
                type='email'
                value={formData.email}
                onChange={handleChange}
                placeholder='name@example.com'
              />
            </div>
          )}

          {step === 2 && (
            <div className='grid gap-2'>
              <Label htmlFor='password'>Create a password</Label>
              <Input
                name='password'
                id='password'
                type='password'
                value={formData.password}
                onChange={handleChange}
                placeholder='••••••••'
              />
            </div>
          )}

          <div className='flex justify-between items-center mt-4'>
            {step > 0 ? (
              <Button type='button' variant='ghost' onClick={handlePrev}>
                <ArrowLeft className='h-4 w-4 mr-2' />
                Back
              </Button>
            ) : (
              <div />
            )}
            <Button type='submit' disabled={isLoading}>
              {isLoading
                ? 'Creating account...'
                : step === 2
                  ? 'Finish'
                  : 'Next'}
              {!isLoading && <ArrowRight className='h-4 w-4 ml-2' />}
            </Button>
          </div>
        </motion.form>
      </AnimatePresence>
    </div>
  )
}
