'use client'

import { useState } from 'react'
import { QuestionReview } from '@/types'
import { saveResult } from '@/lib/quiz-results-store'
import { getNameFromSession } from '@/components/NamePromptModal'

interface SaveResultButtonProps {
  reviews: QuestionReview[]
  score: { correct: number; total: number; percentage: number }
}

export function SaveResultButton({ reviews, score }: SaveResultButtonProps) {
  const [saved, setSaved] = useState(false)

  function handleSave() {
    const name = getNameFromSession()
    if (!name) return

    const weakTopics = new Map<string, number>()
    reviews.forEach(r => {
      if (!r.isCorrect && r.topic) {
        weakTopics.set(r.topic, (weakTopics.get(r.topic) ?? 0) + 1)
      }
    })

    saveResult({
      id: crypto.randomUUID(),
      studentName: name,
      date: new Date().toISOString().slice(0, 10),
      score,
      weakTopics: Array.from(weakTopics.entries()).map(([topic, count]) => ({ topic, count })),
    })

    setSaved(true)
  }

  if (saved) {
    return (
      <div className="flex items-center justify-center gap-2 pt-2">
        <span className="text-xs" style={{ color: '#10B981' }}>
          Saved to dashboard
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <span className="text-xs" style={{ color: 'var(--muted)' }}>
        Saving as <strong style={{ color: 'var(--text)' }}>{getNameFromSession() || '...'}</strong>
      </span>
      <button
        onClick={handleSave}
        className="rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-all active:scale-[0.97]"
        style={{ backgroundColor: '#6366F1' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4F46E5' }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#6366F1' }}
      >
        Save to Dashboard
      </button>
    </div>
  )
}
