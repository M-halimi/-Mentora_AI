'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'quizUserName'

interface NamePromptModalProps {
  onNameSet: (name: string) => void
}

export function getNameFromSession(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function setNameInSession(name: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, name)
  } catch {}
}

export function NamePromptModal({ onNameSet }: NamePromptModalProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const existing = getNameFromSession()
    if (existing) {
      onNameSet(existing)
    }
  }, [onNameSet])

  function handleSubmit() {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter your name')
      return
    }
    if (trimmed.length > 100) {
      setError('Name is too long (max 100 characters)')
      return
    }
    setError('')
    setNameInSession(trimmed)
    onNameSet(trimmed)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{
        backgroundColor: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--card-border)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.12)',
        }}
      >
        <div className="text-center mb-6">
          <div
            className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--accent-soft)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2
            className="text-xl font-bold"
            style={{ color: 'var(--text)', fontFamily: 'var(--font-sora)' }}
          >
            Enter your name
          </h2>
          <p
            className="mt-1.5 text-sm"
            style={{ color: 'var(--muted)' }}
          >
            Your progress will be saved for this session.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error) setError('')
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
            placeholder="Your name"
            autoFocus
            maxLength={100}
            className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors"
            style={{
              borderColor: error ? '#EF4444' : 'var(--border)',
              color: 'var(--text)',
              backgroundColor: 'var(--surface)',
            }}
          />
          {error && (
            <p className="text-xs" style={{ color: '#EF4444' }}>
              {error}
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-40"
            style={{ backgroundColor: '#6366F1' }}
            onMouseEnter={(e) => { if (name.trim()) e.currentTarget.style.backgroundColor = '#4F46E5' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#6366F1' }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
