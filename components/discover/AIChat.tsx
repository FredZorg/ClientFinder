'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AIChatProps {
  onQueryReady: (query: string) => void
}

export function AIChat({ onQueryReady }: AIChatProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestedQuery, setSuggestedQuery] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    const next: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat-refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      const data = await res.json()
      setMessages([...next, { role: 'assistant', content: data.reply }])
      if (data.searchQuery) setSuggestedQuery(data.searchQuery)
    } catch {
      setMessages([...next, { role: 'assistant', content: 'Something went wrong. Try again.' }])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  function useQuery() {
    if (suggestedQuery) {
      onQueryReady(suggestedQuery)
      setOpen(false)
    }
  }

  return (
    <div className="mb-5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
      >
        <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-xs">✦</span>
        {open ? 'Close AI Copilot' : 'AI Copilot — define your ideal target company'}
        <svg className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-indigo-100 bg-white shadow-sm overflow-hidden">
          {/* Messages */}
          <div className="h-64 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <p className="text-sm text-gray-400 text-center pt-10">
                Describe what kind of companies you&apos;re targeting — I&apos;ll help you build the right search query.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[80%] rounded-xl px-3 py-2 text-sm',
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-xl rounded-bl-none px-3 py-2">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggested query banner */}
          {suggestedQuery && (
            <div className="px-4 py-2.5 bg-indigo-50 border-t border-indigo-100 flex items-center justify-between gap-3">
              <p className="text-xs text-indigo-700 flex-1 truncate">
                <span className="font-semibold">Suggested search:</span> {suggestedQuery}
              </p>
              <Button size="sm" onClick={useQuery}>
                Use this →
              </Button>
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="e.g. Mid-size SaaS companies in Denver struggling with ops efficiency..."
              className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
            <Button size="sm" onClick={send} loading={loading} disabled={!input.trim()}>
              Send
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
