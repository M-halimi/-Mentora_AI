'use client'

import { useState, useMemo, useEffect } from 'react'
import { QuestionReview } from '@/types'

interface QuizReviewProps {
  reviews: QuestionReview[]
  score: { correct: number; total: number; percentage: number }
  onReset: () => void
  onBack?: () => void
}

function isMobileSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1)
}

function Celebration({ percentage }: { percentage: number }) {
  const particles = useMemo(() => {
    const p = Math.min(percentage, 100)
    const maxCount = isMobileSafari() ? 10 : 25
    const count = p >= 100 ? maxCount : p >= 80 ? Math.min(20, maxCount) : Math.min(12, maxCount)
    const colors = ['#6366F1', '#818CF8', '#A78BFA', '#C084FC', '#E879F9', '#F472B6']
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      color: colors[i % colors.length],
      left: `${(i / count) * 100}%`,
      delay: `${Math.random() * 0.8}s`,
      duration: `${1.5 + Math.random() * 2}s`,
      size: 3 + Math.random() * 5,
      drift: Math.random() * 80 - 40,
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

export function QuizReview({ reviews, score, onReset, onBack }: QuizReviewProps) {
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

  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set())

  const correctCount = useMemo(() => reviews.filter(r => r.isCorrect).length, [reviews])
  const incorrectCount = useMemo(() => reviews.length - correctCount, [reviews, correctCount])

  const allExpanded = reviews.length > 0 && expandedQuestions.size === reviews.length

  function toggleQuestion(index: number) {
    setExpandedQuestions(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  function expandAll() {
    setExpandedQuestions(new Set(reviews.map((_, i) => i)))
  }

  function collapseAll() {
    setExpandedQuestions(new Set())
  }

  return (
    <>
      {showCelebration && score.percentage >= 60 && <Celebration percentage={score.percentage} />}

      <div className="w-full mx-auto space-y-5 animate-fade-in">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 text-xs font-medium transition-colors"
            style={{ color: 'var(--muted)' }}
          >
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to Summary
          </button>
        )}
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

        {/* Summary */}
        <div className="rounded-[18px] border p-5" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Performance Summary</p>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1" style={{ color: '#10B981' }}>
                <svg className="size-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                {correctCount} correct
              </span>
              <span className="flex items-center gap-1" style={{ color: '#EF4444' }}>
                <svg className="size-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                {incorrectCount} incorrect
              </span>
            </div>
          </div>
          <p className="text-sm font-bold" style={{ color: 'var(--text)', fontFamily: 'var(--font-sora)' }}>
            {score.correct}/{score.total} ({score.percentage}%)
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
            {message.line2}
          </p>
        </div>

        {/* Expand / Collapse */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
            Questions ({reviews.length})
          </p>
          <button
            onClick={allExpanded ? collapseAll : expandAll}
            className="inline-flex items-center gap-1 text-xs font-medium transition-colors"
            style={{ color: '#6366F1' }}
          >
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              {allExpanded ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              )}
            </svg>
            {allExpanded ? 'Collapse all' : 'Expand all'}
          </button>
        </div>

        {/* Per-question Review Cards */}
        <div className="space-y-2">
          {Array.isArray(reviews) ? reviews.map((r, i) => {
            const isExpanded = expandedQuestions.has(i)
            return (
            <div
              key={i}
              className="rounded-[18px] border transition-all duration-200"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div
                className="flex items-center gap-2 p-4 cursor-pointer select-none"
                onClick={() => toggleQuestion(i)}
              >
                <span
                  className="inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-semibold shrink-0"
                  style={{ backgroundColor: 'var(--accent-soft)', color: '#6366F1' }}
                >
                  Q{i + 1}
                </span>
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-medium shrink-0"
                  style={{ color: r.isCorrect ? '#10B981' : '#EF4444' }}
                >
                  <svg className="size-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    {r.isCorrect ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    )}
                  </svg>
                  {r.isCorrect ? 'Correct (+1 pt)' : 'Incorrect (+0 pts)'}
                </span>
                <p className="text-xs truncate flex-1 min-w-0" style={{ color: 'var(--muted)' }}>
                  {r.question}
                </p>
                <svg
                  className="size-4 shrink-0 transition-transform duration-200"
                  style={{ color: 'var(--muted)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text)' }}>
                    {r.question}
                  </p>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium" style={{ color: r.isCorrect ? '#10B981' : '#EF4444' }}>
                      Status: {r.isCorrect ? 'Correct (+1 pt)' : 'Incorrect (+0 pts)'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
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

                  {r.insight && (
                    <div>
                      <p className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--muted)' }}>
                        Insight
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>
                        {r.insight}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--muted)' }}>
                      Explanation
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>
                      {r.explanation}
                    </p>
                  </div>

                  {r.grammarRule && (
                    <div>
                      <p className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--muted)' }}>
                        Rule
                      </p>
                      <p className="text-xs font-medium" style={{ color: '#6366F1' }}>
                        {r.grammarRule}
                      </p>
                    </div>
                  )}

                  {r.example && (
                    <div>
                      <p className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--muted)' }}>
                        Example
                      </p>
                      <p className="text-xs italic" style={{ color: 'var(--text)' }}>
                        &ldquo;{r.example}&rdquo;
                      </p>
                    </div>
                  )}

                  {r.tip && (
                    <div>
                      <p className="text-[10px] font-medium mb-0.5 flex items-center gap-1" style={{ color: '#D97706' }}>
                        <svg className="size-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                        </svg>
                        Learning Tip
                      </p>
                      <p className="text-xs" style={{ color: '#D97706' }}>
                        {r.tip}
                      </p>
                    </div>
                  )}

                  {r.commonMistake && (
                    <div className="rounded-lg border p-3" style={{ borderColor: 'rgba(245,158,11,0.2)', backgroundColor: 'rgba(245,158,11,0.06)' }}>
                      <p className="text-[10px] font-medium mb-0.5" style={{ color: '#D97706' }}>
                        Watch out
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>
                        {r.commonMistake}
                      </p>
                    </div>
                  )}


                </div>
              )}
            </div>
            )
          }) : null}
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
