'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { QuizQuestion } from '@/types'

export default function SharedQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/quiz/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setQuestions(json.data.questions)
        } else {
          setError(json.error || 'Quiz not found')
        }
      })
      .catch(() => setError('Failed to load quiz'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-sm text-zinc-500">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (error || !questions) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-red-50">
          <svg className="size-8 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-zinc-900">Quiz not available</h1>
        <p className="text-sm text-zinc-500">{error || 'This quiz may have expired.'}</p>
        <Link
          href="/"
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors active:scale-[0.97]"
        >
          Create your own quiz
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-zinc-50">
      <div className="mx-auto max-w-2xl px-5 py-8">
        <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 uppercase tracking-wider mb-1">
                <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                Shared Quiz
              </div>
              <p className="text-sm text-zinc-500">{questions.length} multiple-choice questions</p>
        </div>
        <Link
          href="/"
          className="shrink-0 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-all active:scale-[0.97]"
        >
          Create your own
        </Link>
          </div>
        </div>

        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm">
              <span className="inline-flex items-center justify-center rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 mb-4">
                Question {i + 1}
              </span>
              <p className="text-base font-medium text-zinc-900 leading-relaxed mb-4">
                {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <div
                    key={opt}
                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                      q.answer === opt
                        ? 'border-emerald-300 bg-emerald-50'
                        : 'border-zinc-100 bg-zinc-50 text-zinc-500'
                    }`}
                  >
                    <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-semibold ${
                      q.answer === opt
                        ? 'border-emerald-400 bg-emerald-400 text-white'
                        : 'border-zinc-300 text-zinc-500'
                    }`}>
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span className={`pt-0.5 leading-snug ${q.answer === opt ? 'text-zinc-800 font-medium' : ''}`}>
                      {opt}
                    </span>
                    {q.answer === opt && (
                      <svg className="ml-auto mt-0.5 size-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-[0.97]"
          >
            <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            Create your own quiz
          </Link>
        </div>
      </div>
    </div>
  )
}
