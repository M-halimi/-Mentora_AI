'use client'

import { useState } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { UploadForm } from '@/components/UploadForm'
import { QuizResults } from '@/components/QuizResults'
import { QuizQuestion } from '@/types'
import { Footer } from '@/components/Footer'
import { getVisitorId } from '@/lib/client-id'

type Step = 'idle' | 'uploading' | 'ready' | 'generating' | 'complete' | 'error'

export default function Home() {
  const [step, setStep] = useState<Step>('idle')
  const [text, setText] = useState('')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [error, setError] = useState('')

  async function handleTextExtracted(extracted: string) {
    setText(extracted)
    setStep('ready')
  }

  async function handleGenerate() {
    if (!text) return
    setStep('generating')

    const controller = new AbortController()
    const timeout = setTimeout(() => {
      controller.abort()
    }, 30_000)

    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-visitor-id': getVisitorId(),
        },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!res.ok) {
        let msg = `Server error (${res.status})`
        try {
          const err = await res.json()
          msg = err?.error || msg
        } catch {}
        setError(msg)
        setStep('error')
        return
      }

      const json = await res.json()

      if (!json.success) {
        setError(json.error || 'Quiz generation failed')
        setStep('error')
        return
      }

      setQuestions(json.data.questions)
      setStep('complete')
    } catch (err: unknown) {
      clearTimeout(timeout)
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Quiz generation timed out. Please try again.')
      } else {
        setError('Network error during quiz generation.')
      }
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
      {/* Navbar */}
      <header
        className="sticky top-0 z-10 w-full border-b"
        style={{
          height: 52,
          borderColor: 'var(--border)',
          backgroundColor: 'var(--surface)',
        }}
      >
        <div
          className="mx-auto flex h-full items-center justify-between px-5"
          style={{ maxWidth: 500 }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex size-7 items-center justify-center"
              style={{
                borderRadius: 8,
                background: 'linear-gradient(135deg, #6366F1, #818CF8)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <span
              className="text-sm font-semibold"
              style={{
                color: 'var(--text)',
                fontFamily: 'var(--font-sora)',
                letterSpacing: '-0.02em',
              }}
            >
              Teacher Copilot
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 flex-col items-center px-5 py-20">
        {(step === 'idle' || step === 'ready') && (
          <div className="flex w-full flex-col items-center animate-fade-in" style={{ maxWidth: 480 }}>
            {step === 'idle' && (
              <>
                {/* Hero */}
                <div className="flex flex-col items-center text-center mb-12">
                  <div
                    className="flex size-[60px] items-center justify-center mb-6"
                    style={{
                      borderRadius: 18,
                      background: 'linear-gradient(135deg, #5B52D0, #7B6FE8)',
                      boxShadow: '0 8px 32px rgba(99,102,241,0.25)',
                    }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <h1
                    className="text-[32px] font-bold leading-tight text-center"
                    style={{
                      color: 'var(--text)',
                      fontFamily: 'var(--font-sora)',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Generate a Quiz from Any Lesson
                  </h1>
                  <p
                    className="mt-4 text-[15px] text-center leading-relaxed"
                    style={{
                      color: 'var(--muted)',
                      maxWidth: 360,
                      fontFamily: 'var(--font-dm-sans)',
                    }}
                  >
                    Upload a PDF and let AI create 10 multiple-choice questions
                    instantly. Perfect for test prep, review, and self-study.
                  </p>
                </div>
              </>
            )}
            <UploadForm key="upload" onTextExtracted={handleTextExtracted} onGenerate={handleGenerate} />
          </div>
        )}

        {step === 'generating' && (
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <div
              className="size-8 rounded-full border-2 animate-spin-slow"
              style={{ borderColor: 'var(--border)', borderTopColor: '#6366F1' }}
            />
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Generating your quiz with AI&hellip;
            </p>
          </div>
        )}

        {step === 'complete' && (
          <div className="w-full animate-fade-in" style={{ maxWidth: 500 }}>
            <QuizResults questions={questions} onReset={handleReset} />
          </div>
        )}

        {step === 'error' && (
          <div className="flex w-full flex-col items-center gap-4 animate-fade-in" style={{ maxWidth: 400 }}>
            <div
              className="flex size-10 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--error-soft)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <p className="text-sm text-center" style={{ color: 'var(--text)' }}>
              {error}
            </p>
            <button
              onClick={handleReset}
              className="text-xs underline transition-opacity hover:opacity-70"
              style={{ color: 'var(--muted)' }}
            >
              Try again
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
