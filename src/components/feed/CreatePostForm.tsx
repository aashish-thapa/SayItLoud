'use client'

import * as React from 'react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { createPost, analyzePost } from '@/lib/api'
import { Post } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { SendHorizonal, ImageIcon, X, Smile } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'

import { AIAnalysisResponse } from '@/types'

interface CreatePostFormProps {
  onPostCreated: (newPost: Omit<Post, 'user'>) => void
  onPostAnalyzed?: (postId: string, aiAnalysis: AIAnalysisResponse['aiAnalysis']) => void
}

export function CreatePostForm({ onPostCreated, onPostAnalyzed }: CreatePostFormProps) {
  const { user } = useAuth()
  const [content, setContent] = React.useState('')
  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [imagePreview, setImagePreview] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setContent((prevContent) => prevContent + emojiData.emoji)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!content.trim() || !user) return

    setIsLoading(true)
    setError(null)

    try {
      const newPost = await createPost({
        content,
        image: imageFile || undefined,
      })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { user: _, ...postWithoutUser } = newPost
      onPostCreated(postWithoutUser)
      setContent('')
      removeImage()
      setShowEmojiPicker(false)

      // Fire-and-forget AI analysis, update post when complete
      analyzePost(newPost._id)
        .then((analysisResult) => {
          console.log('AI Analysis completed:', analysisResult)
          if (onPostAnalyzed && analysisResult?.aiAnalysis) {
            onPostAnalyzed(newPost._id, analysisResult.aiAnalysis)
          }
        })
        .catch((err) => {
          console.error('AI Analysis failed:', err)
        })
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

  if (!user) {
    return null // Or a login prompt
  }

  return (
    <div className='bg-card rounded-2xl shadow-sm border border-border p-5'>
      <form onSubmit={handleSubmit} className='flex items-start gap-4'>
        <Link href={`/profile/${user.username}`}>
          <div className='w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg flex-shrink-0 relative overflow-hidden'>
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
        </Link>
        <div className='flex-1 space-y-3'>
          {error && <p className='text-destructive text-sm'>{error}</p>}
          <Textarea
            placeholder={`What's on your mind, ${user.username}?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isLoading}
            rows={3}
            className='bg-secondary/50 border-border focus:bg-card'
          />
          {imagePreview && (
            <div className='relative mt-3'>
              <Image
                src={imagePreview}
                alt='Image preview'
                width={500}
                height={300}
                className='rounded-lg object-cover w-full h-auto max-h-72'
              />
              <Button
                size='icon'
                variant='destructive'
                className='absolute top-2 right-2 h-7 w-7 rounded-full'
                onClick={removeImage}
              >
                <X className='h-4 w-4' />
              </Button>
            </div>
          )}
          <div className='flex justify-between items-center'>
            <div className='flex items-center gap-1'>
              <input
                type='file'
                ref={fileInputRef}
                onChange={handleFileChange}
                className='hidden'
                accept='image/png, image/jpeg, image/gif'
                disabled={isLoading}
              />
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <ImageIcon className='w-5 h-5 text-primary' />
              </Button>
              <div className='relative'>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  disabled={isLoading}
                >
                  <Smile className='w-5 h-5 text-primary' />
                </Button>
                {showEmojiPicker && (
                  <div className='absolute z-10 mt-2'>
                    <EmojiPicker onEmojiClick={onEmojiClick} />
                  </div>
                )}
              </div>
            </div>
            <div className='flex justify-end'>
              <Button
                type='submit'
                disabled={isLoading || (!content.trim() && !imageFile)}
              >
                {isLoading ? 'Posting...' : 'Post Thought'}
                {!isLoading && <SendHorizonal className='w-4 h-4 ml-2' />}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
