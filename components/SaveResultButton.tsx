'use client'

import { useState } from 'react'
import { QuestionReview } from '@/types'
import { saveResult } from '@/lib/quiz-results-store'

interface SaveResultButtonProps {
  reviews: QuestionReview[]
  score: { correct: number; total: number; percentage: number }
}

export function SaveResultButton({ reviews, score }: SaveResultButtonProps) {
  const [name, setName] = useState('')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return

    const weakTopics = new Map<string, number>()
    reviews.forEach(r => {
      if (!r.isCorrect && r.topic) {
        weakTopics.set(r.topic, (weakTopics.get(r.topic) ?? 0) + 1)
      }
    })

    saveResult({
      id: crypto.randomUUID(),
      studentName: trimmed,
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
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Student name"
        onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
        className="rounded-lg border px-3 py-1.5 text-xs outline-none transition-colors"
        style={{ borderColor: 'var(--border)', color: 'var(--text)', backgroundColor: 'var(--surface)', width: 140 }}
      />
      <button
        onClick={handleSave}
        disabled={!name.trim()}
        className="rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-all active:scale-[0.97] disabled:opacity-40"
        style={{ backgroundColor: '#6366F1' }}
      >
        Save to Dashboard
      </button>
    </div>
  )
}
