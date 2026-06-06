'use client'

import { useState, useMemo } from 'react'
import { QuizQuestion, Explanation } from '@/types'
import { downloadJSON, downloadPDF } from '@/lib/download'

interface QuizResultsProps {
  questions: QuizQuestion[]
  onReset: () => void
}

export function QuizResults({ questions = [], onReset }: QuizResultsProps) {
  const [revealed, setRevealed] = useState<Record<number, string>>({})
  const [shareState, setShareState] = useState<'idle' | 'loading' | 'copied' | 'error'>('idle')
  const [explanations, setExplanations] = useState<Record<number, Explanation>>({})
  const [explaining, setExplaining] = useState<Record<number, boolean>>({})
  const [explainError, setExplainError] = useState<Record<number, string>>({})
  const [explainLang, setExplainLang] = useState<Record<number, 'base' | 'fr' | 'en' | 'de' | 'ar'>>({})

  const score = useMemo(() => {
    const correct = Object.entries(revealed).filter(
      ([i, answer]) => questions[Number(i)]?.answer === answer
    ).length
    return { correct, total: questions.length, percentage: Math.round((correct / questions.length) * 100) }
  }, [revealed, questions])

  function handleSelect(qIndex: number, option: string) {
    if (revealed[qIndex]) return
    setRevealed((prev) => ({ ...prev, [qIndex]: option }))
  }

  async function handleExplain(qIndex: number) {
    if (explanations[qIndex]) return
    setExplaining((prev) => ({ ...prev, [qIndex]: true }))
    setExplainError((prev) => ({ ...prev, [qIndex]: '' }))

    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questions[qIndex].question,
          correctAnswer: questions[qIndex].answer,
          userAnswer: revealed[qIndex],
        }),
      })
      const json = await res.json()

      if (!json.success) throw new Error(json.error || 'Failed')

      setExplanations((prev) => ({ ...prev, [qIndex]: json.data }))
    } catch {
      setExplainError((prev) => ({ ...prev, [qIndex]: 'Failed to load explanation' }))
    } finally {
      setExplaining((prev) => ({ ...prev, [qIndex]: false }))
    }
  }

  async function handleShare() {
    setShareState('loading')
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions }),
      })
      const json = await res.json()
      if (!json.success) throw new Error()
      const url = `${window.location.origin}/quiz/${json.data.quizId}`
      await navigator.clipboard.writeText(url)
      setShareState('copied')
      setTimeout(() => setShareState('idle'), 2500)
    } catch {
      setShareState('error')
      setTimeout(() => setShareState('idle'), 2500)
    }
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center py-16 animate-scale-in">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-zinc-50">
          <svg className="size-8 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <p className="text-base font-medium text-zinc-700">No quiz available</p>
        <p className="mt-1 text-sm text-zinc-400">Upload a PDF to generate a quiz.</p>
        <button
          onClick={onReset}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-[0.97]"
        >
          Upload PDF
        </button>
      </div>
    )
  }

  const allAnswered = Object.keys(revealed).length === questions.length

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-scale-in">
      {/* Score Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Your Score</p>
            <p className="text-3xl font-bold text-zinc-900 mt-1">
              {score.correct}/{score.total}
              <span className="text-lg font-normal text-zinc-400 ml-1">
                ({score.percentage}%)
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {allAnswered && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Completed
              </span>
            )}
            <button
              onClick={onReset}
              className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-all"
            >
              New quiz
            </button>
          </div>
        </div>
        <div className="mt-4 h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-500 ease-out"
            style={{ width: `${allAnswered ? score.percentage : (Object.keys(revealed).length / questions.length) * 100}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-zinc-400">
          <span>{Object.keys(revealed).length} of {questions.length} answered</span>
          {allAnswered && score.percentage >= 70 && <span className="text-emerald-600 font-medium">Great job!</span>}
          {allAnswered && score.percentage < 70 && score.percentage >= 40 && <span className="text-amber-600 font-medium">Keep practicing!</span>}
          {allAnswered && score.percentage < 40 && <span className="text-red-500 font-medium">Review the material</span>}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => downloadJSON(questions)}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 hover:border-zinc-300 transition-all active:scale-[0.97]"
        >
          <svg className="size-4 text-zinc-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          JSON
        </button>
        <button
          onClick={() => downloadPDF(questions)}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 hover:border-zinc-300 transition-all active:scale-[0.97]"
        >
          <svg className="size-4 text-zinc-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          PDF
        </button>
        <button
          onClick={handleShare}
          disabled={shareState === 'loading'}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-sm transition-all active:scale-[0.97] ${
            shareState === 'copied'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : shareState === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300'
          }`}
        >
          {shareState === 'loading' ? (
            <div className="size-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
          ) : shareState === 'copied' ? (
            <svg className="size-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          ) : shareState === 'error' ? (
            <svg className="size-4 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          ) : (
            <svg className="size-4 text-zinc-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
            </svg>
          )}
          {shareState === 'copied' ? 'Copied!' : shareState === 'error' ? 'Failed' : 'Share'}
        </button>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, i) => {
          const selected = revealed[i] ?? null
          const isCorrect = selected === q.answer
          const isAnswered = selected !== null
          const exp = explanations[i]
          const isLoading = explaining[i]
          const expErr = explainError[i]

          return (
            <div
              key={i}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="inline-flex items-center justify-center rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">
                  Question {i + 1}
                </span>
                {isAnswered && (
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                    isCorrect ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      {isCorrect ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      )}
                    </svg>
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                )}
              </div>

              <p className="text-base font-medium text-zinc-900 leading-relaxed">
                {q.question}
              </p>

              <div className="mt-4 space-y-2">
                {q.options?.map((opt) => {
                  const isSelected = selected === opt
                  const isAnswer = q.answer === opt

                  let optionStyle = 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 cursor-pointer'

                  if (isAnswered) {
                    if (isAnswer) {
                      optionStyle = 'border-emerald-300 bg-emerald-50 ring-1 ring-emerald-300'
                    } else if (isSelected && !isCorrect) {
                      optionStyle = 'border-red-300 bg-red-50 ring-1 ring-red-300'
                    } else {
                      optionStyle = 'border-zinc-100 bg-zinc-50 text-zinc-400'
                    }
                  }

                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelect(i, opt)}
                      disabled={isAnswered}
                      className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-all duration-150 active:scale-[0.99] ${optionStyle}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-semibold transition-colors ${
                          isAnswered && isAnswer
                            ? 'border-emerald-400 bg-emerald-400 text-white'
                            : isAnswered && isSelected && !isCorrect
                            ? 'border-red-400 bg-red-400 text-white'
                            : 'border-zinc-300 text-zinc-500'
                        }`}>
                          {String.fromCharCode(65 + q.options.indexOf(opt))}
                        </span>
                        <span className={`pt-0.5 leading-snug ${
                          isAnswered && !isAnswer && !isSelected ? 'text-zinc-400' : 'text-zinc-800'
                        }`}>
                          {opt}
                        </span>
                        {isAnswered && isAnswer && (
                          <svg className="ml-auto mt-0.5 size-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {isAnswered && !isCorrect && (
                <div className="mt-3 rounded-lg bg-amber-50 border border-amber-100 px-3.5 py-2.5">
                  <p className="text-xs text-amber-800">
                    <span className="font-medium">Correct answer:</span> {q.answer}
                  </p>
                </div>
              )}

              {/* Explain Button */}
              {isAnswered && !exp && !isLoading && !expErr && (
                <button
                  onClick={() => handleExplain(i)}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                  </svg>
                  Explain this answer
                </button>
              )}

              {isLoading && (
                <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
                  <div className="size-3.5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                  Getting explanation...
                </div>
              )}

              {expErr && (
                <p className="mt-3 text-xs text-red-500">{expErr}</p>
              )}

              {/* Explanation Panel */}
              {exp && (
                <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 animate-scale-in">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        exp.status === 'Correct' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {exp.status}
                      </span>
                      <span className="text-[11px] font-medium text-indigo-600">Teacher's Explanation</span>
                    </div>
                  </div>

                  {/* Language Tabs */}
                  <div className="mb-3 flex gap-1">
                    {(['base', 'en', 'fr', 'de', 'ar'] as const).map((lang) => {
                      const current = explainLang[i] || 'base'
                      return (
                        <button
                          key={lang}
                          onClick={() => setExplainLang((prev) => ({ ...prev, [i]: lang }))}
                          className={`rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
                            current === lang
                              ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                              : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'
                          }`}
                        >
                          {lang === 'base' ? 'Base' : lang.toUpperCase()}
                        </button>
                      )
                    })}
                  </div>

                  {(() => {
                    const l = explainLang[i] || 'base'

                    return (
                      <>
                        <div className="mb-2.5">
                          <p className="text-xs font-medium text-zinc-500 mb-0.5">
                            {l === 'base' ? 'Explanation' : 'Explanation'}
                          </p>
                          <p className="text-sm text-zinc-700">{exp.explanation[l]}</p>
                        </div>

                        <div className="mb-2.5">
                          <p className="text-xs font-medium text-zinc-500 mb-0.5">
                            {l === 'base' ? 'Grammar Rule' : 'Grammar Rule'}
                          </p>
                          <p className="text-sm text-zinc-700">{exp.grammar_rule[l]}</p>
                        </div>

                        <div className="mb-2.5">
                          <p className="text-xs font-medium text-zinc-500 mb-0.5">
                            {l === 'base' ? 'Example' : 'Example'}
                          </p>
                          <p className="text-sm text-zinc-700 italic">{exp.example[l]}</p>
                        </div>

                        <div className="mb-0">
                          <p className="text-xs font-medium text-zinc-500 mb-0.5">
                            {l === 'base' ? 'Tip' : 'Tip'}
                          </p>
                          <p className="text-sm text-zinc-700">{exp.tip[l]}</p>
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="text-center pt-2 pb-8">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-[0.97]"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          Upload another PDF
        </button>
      </div>
    </div>
  )
}
