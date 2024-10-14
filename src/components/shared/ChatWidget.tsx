'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import type { ChatMessage } from '@/modules/ai/types'

const SUGGESTIONS = [
  'Best PS5 exclusives?',
  'Games like Elden Ring?',
  'Scary game under $50?',
  'Good RPGs on PS4?',
]

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || streaming) return

    const userMsg: ChatMessage = { role: 'user', content }
    const nextMessages = [...messages, userMsg]
    setMessages([...nextMessages, { role: 'assistant', content: '' }])
    setInput('')
    setStreaming(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      })

      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') break

          try {
            const parsed = JSON.parse(payload)
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.content) {
              setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: updated[updated.length - 1].content + parsed.content,
                }
                return updated
              })
            }
          } catch {
            // skip malformed chunk
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        }
        return updated
      })
    } finally {
      setStreaming(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div
          className="flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{
            width: 340,
            height: 480,
            background: '#111113',
            border: '1px solid #27272A',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ background: '#7C3AED' }}
          >
            <div>
              <p className="text-white font-semibold text-sm leading-tight">GameVault AI Advisor</p>
              <p className="text-violet-200 text-xs">Llama 3.3 · Semantic Search</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white text-lg leading-none"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="pt-2">
                <p className="text-center text-xs mb-4" style={{ color: '#A1A1AA' }}>
                  Ask me anything about PS4 &amp; PS5 games
                </p>
                <div className="flex flex-col gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left text-xs px-3 py-2 rounded-lg transition-colors"
                      style={{
                        background: '#18181B',
                        color: '#A1A1AA',
                        border: '1px solid #27272A',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#7C3AED'
                        e.currentTarget.style.color = '#F4F4F5'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#27272A'
                        e.currentTarget.style.color = '#A1A1AA'
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap"
                  style={
                    msg.role === 'user'
                      ? { background: '#7C3AED', color: '#F4F4F5' }
                      : { background: '#18181B', color: '#F4F4F5', border: '1px solid #27272A' }
                  }
                >
                  {msg.content ||
                    (streaming && i === messages.length - 1 ? (
                      <span className="inline-flex gap-1">
                        <span className="animate-bounce" style={{ animationDelay: '0ms' }}>·</span>
                        <span className="animate-bounce" style={{ animationDelay: '150ms' }}>·</span>
                        <span className="animate-bounce" style={{ animationDelay: '300ms' }}>·</span>
                      </span>
                    ) : (
                      ''
                    ))}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            className="px-3 py-3 flex gap-2 shrink-0"
            style={{ borderTop: '1px solid #27272A' }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about games…"
              disabled={streaming}
              className="flex-1 rounded-lg px-3 py-2 text-sm outline-none disabled:opacity-50"
              style={{
                background: '#18181B',
                color: '#F4F4F5',
                border: '1px solid #27272A',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#7C3AED')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#27272A')}
            />
            <button
              onClick={() => send()}
              disabled={streaming || !input.trim()}
              className="rounded-lg px-3 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-40"
              style={{ background: '#7C3AED' }}
            >
              ↑
            </button>
          </div>
        </div>
      )}

      {/* FAB toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white text-xl transition-transform hover:scale-105 active:scale-95"
        style={{ background: '#7C3AED' }}
        aria-label={open ? 'Close AI Advisor' : 'Open AI Advisor'}
      >
        {open ? '✕' : '💬'}
      </button>
    </div>
  )
}
