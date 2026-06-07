'use client'

import { useState, useMemo, useEffect } from 'react'
import { QuestionReview } from '@/types'

interface QuizReviewProps {
  reviews: QuestionReview[]
  score: { correct: number; total: number; percentage: number }
  onReset: () => void
}

function Celebration({ percentage }: { percentage: number }) {
  const particles = useMemo(() => {
    const p = Math.min(percentage, 100)
    const count = p >= 100 ? 60 : p >= 80 ? 40 : p >= 60 ? 25 : 12
    const colors = ['#6366F1', '#818CF8', '#A78BFA', '#C084FC', '#E879F9', '#F472B6']
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      color: colors[i % colors.length],
      left: `${(i / count) * 100}%`,
      delay: `${Math.random() * 0.8}s`,
      duration: `${1.5 + Math.random() * 2}s`,
      size: 4 + Math.random() * 8,
      drift: Math.random() * 120 - 60,
    }))
  }, [percentage])

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-confetti"
          style={{
            left: p.left,
            top: -10,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
            '--drift': `${p.drift}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

export function QuizReview({ reviews, score, onReset }: QuizReviewProps) {
  const [showCelebration, setShowCelebration] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowCelebration(false), 3500)
    return () => clearTimeout(timer)
  }, [])

  const message = useMemo(() => {
    const p = score.percentage
    if (p === 100) return { line1: 'Perfect Score!', line2: 'You mastered every question.' }
    if (p >= 80) return { line1: 'Excellent Work!', line2: 'You really know your stuff.' }
    if (p >= 60) return { line1: 'Good Effort!', line2: 'Keep practicing to improve.' }
    return { line1: 'Keep Practicing!', line2: 'Review the material and try again.' }
  }, [score.percentage])

  return (
    <>
      {showCelebration && score.percentage >= 60 && <Celebration percentage={score.percentage} />}

      <div className="w-full mx-auto space-y-5 animate-fade-in">
        {/* Celebration Banner */}
        <div
          className="relative overflow-hidden rounded-[18px] border p-6 text-center"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              background: `radial-gradient(circle at 50% 0%, #6366F1 0%, transparent 60%)`,
            }}
          />
          <div className="relative">
            <div
              className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full"
              style={{
                background:
                  score.percentage >= 80
                    ? 'linear-gradient(135deg, #10B981, #34D399)'
                    : score.percentage >= 60
                      ? 'linear-gradient(135deg, #F59E0B, #FBBF24)'
                      : 'linear-gradient(135deg, #6366F1, #818CF8)',
              }}
            >
              {score.percentage >= 80 ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 6v6l4 2" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              )}
            </div>
            <p
              className="text-xl font-bold"
              style={{ color: 'var(--text)', fontFamily: 'var(--font-sora)' }}
            >
              {message.line1}
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
              {message.line2}
            </p>
            <p
              className="mt-3 text-3xl font-bold"
              style={{ color: 'var(--text)', fontFamily: 'var(--font-sora)' }}
            >
              {score.correct}/{score.total}
              <span className="text-base font-normal ml-1" style={{ color: 'var(--muted)' }}>
                ({score.percentage}%)
              </span>
            </p>
          </div>
        </div>

        {/* Per-question Review Cards */}
        <div className="space-y-3">
          {reviews.map((r, i) => (
            <div
              key={i}
              className="rounded-[18px] border p-5 transition-all duration-200"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <span
                  className="inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-semibold"
                  style={{ backgroundColor: 'var(--accent-soft)', color: '#6366F1' }}
                >
                  Question {i + 1}
                </span>
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-medium"
                  style={{ color: r.isCorrect ? '#10B981' : '#EF4444' }}
                >
                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    {r.isCorrect ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    )}
                  </svg>
                  {r.isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </div>

              {/* Question */}
              <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text)' }}>
                {r.question}
              </p>

              {/* Answers */}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                <span style={{ color: 'var(--muted)' }}>
                  Your answer:{' '}
                  <span className="font-medium" style={{ color: r.isCorrect ? '#10B981' : '#EF4444' }}>
                    {r.userAnswer}
                  </span>
                </span>
                {!r.isCorrect && (
                  <span style={{ color: 'var(--muted)' }}>
                    Correct answer:{' '}
                    <span className="font-medium" style={{ color: '#10B981' }}>
                      {r.correctAnswer}
                    </span>
                  </span>
                )}
              </div>

              {/* Explanation */}
              <div className="mt-3 rounded-xl border p-4" style={{ borderColor: 'rgba(99,102,241,0.2)', backgroundColor: 'var(--accent-soft)' }}>
                <div className="mb-2">
                  <p className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--muted)' }}>
                    Explanation
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>
                    {r.explanation}
                  </p>
                </div>

                {/* Grammar Rule */}
                {r.grammarRule && (
                  <div className="mb-2">
                    <p className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--muted)' }}>
                      Grammar Rule
                    </p>
                    <p className="text-xs font-medium" style={{ color: '#6366F1' }}>
                      {r.grammarRule}
                    </p>
                  </div>
                )}

                {/* Example */}
                {r.example && (
                  <div className="mb-2">
                    <p className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--muted)' }}>
                      Example
                    </p>
                    <p className="text-xs italic" style={{ color: 'var(--text)' }}>
                      &ldquo;{r.example}&rdquo;
                    </p>
                  </div>
                )}

                {/* Tip */}
                {r.tip && (
                  <div>
                    <p className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--muted)' }}>
                      Tip
                    </p>
                    <p className="text-xs" style={{ color: '#D97706' }}>
                      {r.tip}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center pt-2 pb-8">
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.97]"
            style={{ backgroundColor: '#6366F1', fontFamily: 'var(--font-sora)' }}
          >
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            Try another quiz
          </button>
        </div>
      </div>
    </>
  )
}
