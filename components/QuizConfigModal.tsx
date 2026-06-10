'use client'

import { useState } from 'react'
import { QuizConfig } from '@/types'
import { saveConfig } from '@/lib/quiz-session'

interface QuizConfigModalProps {
  onConfirm: (config: QuizConfig) => void
  onCancel: () => void
}

const QUESTION_COUNTS = [10, 15, 20, 25] as const
const DIFFICULTIES = ['easy', 'medium', 'hard', 'mixed'] as const
const MODES = [
  { value: 'practice' as const, label: 'Practice', desc: 'See answers & explanations after each question' },
  { value: 'exam' as const, label: 'Exam', desc: 'Timer runs, results shown at the end' },
]

export function QuizConfigModal({ onConfirm, onCancel }: QuizConfigModalProps) {
  const [numQuestions, setNumQuestions] = useState<QuizConfig['numQuestions']>(10)
  const [difficulty, setDifficulty] = useState<QuizConfig['difficulty']>('mixed')
  const [mode, setMode] = useState<QuizConfig['mode']>('practice')

  function handleGenerate() {
    const config: QuizConfig = { numQuestions, difficulty, mode }
    saveConfig(config)
    onConfirm(config)
  }

  const labelStyle: React.CSSProperties = {
    color: 'var(--muted)',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
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
        <div className="text-center mb-7">
          <h2
            className="text-xl font-bold"
            style={{ color: 'var(--text)', fontFamily: 'var(--font-sora)' }}
          >
            Choose Quiz Settings
          </h2>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--muted)' }}>
            Customize your quiz before generating
          </p>
        </div>

        <div className="space-y-6">
          {/* Number of Questions */}
          <div>
            <p style={labelStyle} className="mb-2">Number of Questions</p>
            <div className="grid grid-cols-4 gap-2">
              {QUESTION_COUNTS.map((n) => (
                <button
                  key={n}
                  onClick={() => setNumQuestions(n)}
                  className="rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-[0.97]"
                  style={{
                    backgroundColor: numQuestions === n ? '#6366F1' : 'var(--surface)',
                    color: numQuestions === n ? 'white' : 'var(--text)',
                    border: `1px solid ${numQuestions === n ? '#6366F1' : 'var(--border)'}`,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <p style={labelStyle} className="mb-2">Difficulty</p>
            <div className="grid grid-cols-4 gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className="rounded-xl py-2.5 text-xs font-semibold capitalize transition-all active:scale-[0.97]"
                  style={{
                    backgroundColor: difficulty === d ? '#6366F1' : 'var(--surface)',
                    color: difficulty === d ? 'white' : 'var(--text)',
                    border: `1px solid ${difficulty === d ? '#6366F1' : 'var(--border)'}`,
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Mode */}
          <div>
            <p style={labelStyle} className="mb-2">Mode</p>
            <div className="grid grid-cols-2 gap-2">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className="rounded-xl p-3 text-left transition-all active:scale-[0.97]"
                  style={{
                    backgroundColor: mode === m.value ? 'rgba(99,102,241,0.08)' : 'var(--surface)',
                    border: `1px solid ${mode === m.value ? '#6366F1' : 'var(--border)'}`,
                  }}
                >
                  <p className="text-xs font-semibold" style={{ color: mode === m.value ? '#6366F1' : 'var(--text)' }}>
                    {m.label}
                  </p>
                  <p className="text-[10px] mt-0.5 leading-tight" style={{ color: 'var(--muted)' }}>
                    {m.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-8">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-all active:scale-[0.97]"
            style={{
              color: 'var(--muted)',
              border: '1px solid var(--border)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            className="flex-[2] rounded-xl py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.97]"
            style={{ backgroundColor: '#6366F1' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4F46E5' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#6366F1' }}
          >
            Generate Quiz
          </button>
        </div>
      </div>
    </div>
  )
}
