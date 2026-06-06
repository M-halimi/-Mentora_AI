'use client'

import { useState } from 'react'
import { UploadForm } from '@/components/UploadForm'
import { QuizResults } from '@/components/QuizResults'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { QuizQuestion } from '@/types'
import { Footer } from "@/components/Footer"
type Step = 'idle' | 'generating' | 'complete' | 'error'

export default function Home() {
  const [step, setStep] = useState<Step>('idle')
  const [text, setText] = useState('')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [error, setError] = useState('')

  async function handleTextExtracted(extracted: string) {
    setText(extracted)
    setStep('generating')

    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: extracted }),
      })
      const json = await res.json()

      if (!json.success) {
        setError(json.error?.message || json.error || 'Quiz generation failed')
        setStep('error')
        return
      }

      setQuestions(json.data.questions)
      setStep('complete')
    } catch {
      setError('Network error during quiz generation.')
      setStep('error')
    }
  }

  function handleReset() {
    setStep('idle')
    setText('')
    setQuestions([])
    setError('')
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-zinc-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-sm shadow-indigo-200">
              <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
              </svg>
            </div>
            <span className="truncate text-base font-semibold text-zinc-900">Teacher Copilot</span>
          </div>
          {step === 'complete' && (
            <button
              onClick={handleReset}
              className="shrink-0 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-all active:scale-[0.97]"
            >
              New quiz
            </button>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 flex-col items-center px-5 py-12 sm:py-16">
        {step === 'idle' && (
          <div className="w-full max-w-lg animate-slide-up">
            {/* Hero */}
            <div className="mb-10 text-center">
              <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-200">
                <svg className="size-8 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                Generate a Quiz from Any Lesson
              </h1>
              <p className="mt-3 text-base text-zinc-500 max-w-md mx-auto leading-relaxed">
                Upload a PDF and let AI create 10 multiple-choice questions instantly. Perfect for test prep, review, and self-study.
              </p>
            </div>
            <UploadForm onTextExtracted={handleTextExtracted} />
          </div>
        )}

        {step === 'generating' && (
          <div className="w-full max-w-lg animate-slide-up">
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm text-center">
              <LoadingSpinner message="Generating your quiz with AI..." step="generating" />
              <div className="mt-6 flex justify-center gap-1.5">
                <span className="size-1.5 rounded-full bg-indigo-300 animate-pulse-soft" style={{ animationDelay: '0ms' }} />
                <span className="size-1.5 rounded-full bg-indigo-400 animate-pulse-soft" style={{ animationDelay: '300ms' }} />
                <span className="size-1.5 rounded-full bg-indigo-500 animate-pulse-soft" style={{ animationDelay: '600ms' }} />
              </div>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="w-full animate-slide-up">
            <QuizResults questions={questions} onReset={handleReset} />
          </div>
        )}

        {step === 'error' && (
          <div className="w-full max-w-lg animate-slide-up">
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
              <ErrorMessage message={error} onDismiss={handleReset} />
              <div className="mt-4 text-center">
                <button
                  onClick={handleReset}
                  className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-all active:scale-[0.97]"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
  
    </div>
  )
}
