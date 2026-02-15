'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ScrollArea } from '@/components/ui/ScrollArea'
import Markdown from 'react-markdown'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'Explain quantum computing simply',
  'What causes the northern lights?',
  'Summarize the theory of relativity',
]

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async (text?: string) => {
    const trimmed = (text ?? input).trim()
    if (!trimmed || isLoading) return

    const userMessage: Message = { role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      })

      const data = await res.json()

      if (res.ok && data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.reply },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.error || 'Something went wrong. Please try again.',
          },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Unable to reach the server. Please try again later.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex items-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95',
          isOpen
            ? 'h-12 w-12 justify-center rounded-full bg-muted text-muted-foreground'
            : 'rounded-full bg-primary px-5 py-3 text-primary-foreground'
        )}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <X className='h-5 w-5' />
        ) : (
          <>
            <Bot className='h-5 w-5' />
            <span className='text-sm font-semibold'>Chat with AI</span>
          </>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className='fixed inset-4 bottom-24 z-50 flex flex-col rounded-2xl border border-border bg-card shadow-xl sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[380px] sm:h-[500px]'>
          {/* Header */}
          <div className='flex items-center gap-3 border-b border-border px-4 py-3 bg-primary/5 rounded-t-2xl'>
            <div className='flex h-9 w-9 items-center justify-center rounded-full bg-primary/10'>
              <Sparkles className='h-4 w-4 text-primary' />
            </div>
            <div className='flex-1'>
              <h3 className='font-bold text-card-foreground text-sm'>
                SayItLoud AI
              </h3>
              <p className='text-xs text-muted-foreground'>
                Powered by Llama - always here to help
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className='rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors'
              aria-label='Close chat'
            >
              <X className='h-4 w-4' />
            </button>
          </div>

          {/* Messages */}
          <ScrollArea className='flex-1 px-4 py-3' ref={scrollRef}>
            {messages.length === 0 ? (
              <div className='flex flex-col items-center py-6 px-2'>
                <div className='flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4'>
                  <Bot className='h-7 w-7 text-primary' />
                </div>
                <p className='font-semibold text-card-foreground text-center mb-1'>
                  Ask anything, get answers.
                </p>
                <p className='text-sm text-muted-foreground text-center mb-5'>
                  Powered by AI — ask a question and get a sourced response.
                </p>
                <div className='flex flex-col gap-2 w-full'>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className='text-left text-sm px-3 py-2 rounded-xl border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors'
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className='space-y-3'>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {msg.role === 'assistant' && (
                      <div className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 mr-2 mt-1'>
                        <Bot className='h-3.5 w-3.5 text-primary' />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[75%] rounded-2xl px-3 py-2 text-sm',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground whitespace-pre-wrap'
                          : 'bg-accent text-accent-foreground prose prose-sm max-w-none [&_*]:text-accent-foreground [&_strong]:text-accent-foreground [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-sm [&_h2]:text-sm [&_h3]:text-sm [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold [&_h1]:mt-3 [&_h2]:mt-3 [&_h3]:mt-2 [&_h1]:mb-1 [&_h2]:mb-1 [&_h3]:mb-1'
                      )}
                    >
                      {msg.role === 'user' ? (
                        msg.content
                      ) : (
                        <Markdown>{msg.content}</Markdown>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className='flex justify-start'>
                    <div className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 mr-2 mt-1'>
                      <Bot className='h-3.5 w-3.5 text-primary' />
                    </div>
                    <div className='flex items-center gap-2 rounded-2xl bg-accent px-3 py-2 text-sm text-muted-foreground'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      Thinking...
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input bar */}
          <div className='flex items-center gap-2 border-t border-border px-4 py-3'>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Ask me anything...'
              disabled={isLoading}
              className='flex-1'
            />
            <Button
              size='icon'
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              aria-label='Send message'
            >
              <Send className='h-4 w-4' />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
