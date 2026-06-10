'use client'

import { useEffect, useState } from 'react'

interface QuizTimerProps {
  formatted: string
  progress: number
  phase: 'normal' | 'warning' | 'critical'
}

export function QuizTimer({ formatted, progress, phase }: QuizTimerProps) {
  const [blink, setBlink] = useState(false)

  useEffect(() => {
    if (phase !== 'critical') {
      setBlink(false)
      return
    }
    const interval = setInterval(() => setBlink(v => !v), 800)
    return () => clearInterval(interval)
  }, [phase])

  const color = phase === 'critical' ? '#EF4444' : phase === 'warning' ? '#F59E0B' : 'var(--muted)'
  const bgColor = phase === 'critical' ? 'rgba(239,68,68,0.1)' : phase === 'warning' ? 'rgba(245,158,11,0.1)' : 'var(--surface)'
  const borderColor = phase === 'critical' ? 'rgba(239,68,68,0.3)' : phase === 'warning' ? 'rgba(245,158,11,0.3)' : 'var(--border)'

  return (
    <div
      className="sticky top-[52px] z-20 w-full border-b transition-all duration-300"
      style={{
        backgroundColor: bgColor,
        borderColor,
        opacity: blink ? 0.4 : 1,
      }}
    >
      <div className="mx-auto flex items-center justify-between px-5 py-2" style={{ maxWidth: 500 }}>
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span
            className="text-sm font-semibold tabular-nums"
            style={{ color, fontFamily: 'var(--font-sora)', letterSpacing: '-0.02em' }}
          >
            {formatted}
          </span>
        </div>
        <div
          className="h-1 flex-1 max-w-[120px] rounded-full overflow-hidden ml-3"
          style={{ backgroundColor: 'var(--border)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{
              width: `${(1 - progress) * 100}%`,
              backgroundColor: color,
            }}
          />
        </div>
      </div>
    </div>
  )
}
