'use client'

import { useMemo } from 'react'
import { QuestionReview } from '@/types'

interface QuizResultScreenProps {
  score: { correct: number; total: number; percentage: number }
  reviews: QuestionReview[]
  onViewFullReview: () => void
  onReset: () => void
}

function getPriority(wrong: number): { label: string; color: string; bg: string } {
  if (wrong >= 3) return { label: 'High', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' }
  if (wrong === 2) return { label: 'Medium', color: '#D97706', bg: 'rgba(217,119,6,0.1)' }
  return { label: 'Low', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' }
}

export function QuizResultScreen({ score, reviews, onViewFullReview, onReset }: QuizResultScreenProps) {
  const message = useMemo(() => {
    const p = score.percentage
    if (p === 100) return 'You mastered every question.'
    if (p >= 80) return 'You really know your stuff.'
    if (p >= 60) return 'Keep practicing to improve.'
    return 'Review the material and try again.'
  }, [score.percentage])

  const title = useMemo(() => {
    const p = score.percentage
    if (p === 100) return 'Perfect Score!'
    if (p >= 80) return 'Excellent Work!'
    if (p >= 60) return 'Good Effort!'
    return 'Keep Practicing!'
  }, [score.percentage])

  const weakTopics = useMemo(() => {
    const map = new Map<string, number>()
    reviews.forEach(r => {
      if (!r.isCorrect && r.topic) {
        map.set(r.topic, (map.get(r.topic) ?? 0) + 1)
      }
    })
    return Array.from(map.entries())
      .map(([topic, count]) => ({ topic, count, priority: getPriority(count) }))
      .sort((a, b) => b.count - a.count)
  }, [reviews])

  const totalWrong = useMemo(() => reviews.filter(r => !r.isCorrect).length, [reviews])

  return (
    <div className="w-full animate-fade-in space-y-5">
      {/* Score Card */}
      <div className="rounded-[18px] border p-6 text-center" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div
          className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full"
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
        <p className="text-xl font-bold" style={{ color: 'var(--text)', fontFamily: 'var(--font-sora)' }}>
          {title}
        </p>
        <p className="mt-3 text-4xl font-bold" style={{ color: 'var(--text)', fontFamily: 'var(--font-sora)' }}>
          {score.correct}/{score.total}
          <span className="text-lg font-normal ml-1" style={{ color: 'var(--muted)' }}>
            ({score.percentage}%)
          </span>
        </p>
        <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
          {message}
        </p>
      </div>

      {/* Weakness Summary */}
      {weakTopics.length > 0 && (
        <div className="rounded-[18px] border p-5" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
              Weakness Summary
            </p>
            <span className="text-[10px] font-medium" style={{ color: 'var(--muted)' }}>
              {totalWrong} mistake{totalWrong > 1 ? 's' : ''} total
            </span>
          </div>
          <div className="space-y-2">
            {weakTopics.map(({ topic, count, priority }) => (
              <div
                key={topic}
                className="flex items-center justify-between rounded-lg border px-3.5 py-2.5"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <svg className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#EF4444">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  <span className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>
                    {topic}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
                    {count} mistake{count > 1 ? 's' : ''}
                  </span>
                </div>
                <span
                  className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    color: priority.color,
                    backgroundColor: priority.bg,
                  }}
                >
                  {priority.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {weakTopics.length === 0 && (
        <div className="rounded-[18px] border p-4 text-center" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="text-xs font-medium" style={{ color: '#10B981' }}>
            No mistakes found. Great job!
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col items-center gap-3 pt-2 pb-8">
        <button
          onClick={onViewFullReview}
          className="inline-flex items-center gap-1.5 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all active:scale-[0.97]"
          style={{ backgroundColor: '#6366F1', fontFamily: 'var(--font-sora)' }}
        >
          View Full Review
          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m9 5.25 6.75 6.75L9 18.75" />
          </svg>
        </button>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
          style={{ color: 'var(--muted)' }}
        >
          <svg className="size-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          New Quiz
        </button>
      </div>
    </div>
  )
}
