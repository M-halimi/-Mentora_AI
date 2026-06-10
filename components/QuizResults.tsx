'use client'

import { Component, useState, useMemo, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { QuizQuestion, Explanation, QuestionReview } from '@/types'
import { downloadJSON, downloadPDF } from '@/lib/download'
import { QuizReview } from './QuizReview'
import { QuizResultScreen } from './QuizResultScreen'
import { SaveResultButton } from './SaveResultButton'
import { saveRevealed, markSubmitted, isSubmitted, saveAnalysis, loadAnalysis } from '@/lib/quiz-session'

class ReviewErrorBoundary extends Component<
  { children: ReactNode; onReset: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; onReset: () => void }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('[ReviewErrorBoundary] Caught:', error.message)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full text-center py-16 animate-fade-in">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
            <svg className="size-6" style={{ color: 'var(--muted)' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Review temporarily unavailable</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
            Something went wrong while loading the review.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false })
              this.props.onReset()
            }}
            className="mt-6 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.97]"
            style={{ backgroundColor: '#6366F1' }}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

interface QuizResultsProps {
  questions: QuizQuestion[]
  onReset: () => void
  forceSubmitted?: boolean
  mode?: 'practice' | 'exam'
}

export function QuizResults({ questions = [], onReset, forceSubmitted = false, mode = 'practice' }: QuizResultsProps) {
  const [revealed, setRevealed] = useState<Record<number, string>>({})
  const [shareState, setShareState] = useState<'idle' | 'loading' | 'copied' | 'error'>('idle')
  const [explanations, setExplanations] = useState<Record<number, Explanation>>({})
  const [explaining, setExplaining] = useState<Record<number, boolean>>({})
  const [explainError, setExplainError] = useState<Record<number, string>>({})
  const [explainLang, setExplainLang] = useState<Record<number, 'base' | 'fr' | 'en' | 'de' | 'ar'>>({})
  const [reviews, setReviews] = useState<QuestionReview[] | null>(null)
  const [reviewState, setReviewState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [reviewStep, setReviewStep] = useState<'result' | 'review'>('result')
  const [submitted, setSubmitted] = useState(false)
  const isSubmittingRef = useRef(false)

  const alreadySubmitted = isSubmitted(questions)
  const allAnswered = Object.keys(revealed).length === questions.length

  useEffect(() => {
    const cached = loadAnalysis<QuestionReview[]>(questions)
    if (cached && cached.length > 0) {
      setReviews(cached)
      setReviewState('idle')
    }
  }, [questions])

  useEffect(() => {
    if (alreadySubmitted && !reviews) {
      setSubmitted(true)
    }
  }, [alreadySubmitted, reviews])

  useEffect(() => {
    saveRevealed(revealed)
  }, [revealed])

  const isLocked = forceSubmitted || submitted

  useEffect(() => {
    if (isLocked && (allAnswered || forceSubmitted) && !reviews && reviewState === 'idle') {
      handleReview()
    }
  }, [isLocked, allAnswered, forceSubmitted, reviewState, reviews])

  function handleSubmit() {
    if (isSubmittingRef.current || reviews) return
    isSubmittingRef.current = true
    setSubmitted(true)
    markSubmitted(questions)
    if (allAnswered) {
      handleReview()
    }
  }

  const score = useMemo(() => {
    const correct = Object.entries(revealed).filter(
      ([i, answer]) => questions[Number(i)]?.answer === answer
    ).length
    return { correct, total: questions.length, percentage: Math.round((correct / questions.length) * 100) }
  }, [revealed, questions])

  function handleSelect(qIndex: number, option: string) {
    if (revealed[qIndex] || isLocked) return
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
      const baseUrl = window.location.origin
      const url = `${baseUrl}/quiz/${json.data.quizId}`
      try {
        if (navigator.share) {
          await navigator.share({ title: 'Teacher Copilot Quiz', url })
          return
        }
      } catch {
      }
      try {
        await navigator.clipboard.writeText(url)
      } catch {
        const textarea = document.createElement('textarea')
        textarea.value = url
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        try {
          document.execCommand('copy')
        } catch {}
        document.body.removeChild(textarea)
      }
      setShareState('copied')
      setTimeout(() => setShareState('idle'), 2500)
    } catch {
      setShareState('error')
      setTimeout(() => setShareState('idle'), 2500)
    }
  }

  async function handleReview() {
    if (reviews || reviewState === 'loading') return
    setReviewState('loading')

    const cached = loadAnalysis<QuestionReview[]>(questions)
    if (cached && cached.length > 0) {
      setReviews(cached)
      setReviewState('idle')
      return
    }

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions, userAnswers: revealed }),
      })
      if (!res.ok) {
        throw new Error(`Server error (${res.status})`)
      }
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Review failed')
      if (!Array.isArray(json.data)) {
        throw new Error('Invalid review data received')
      }
      setReviews(json.data)
      saveAnalysis(questions, json.data)
      setReviewState('idle')
    } catch (err) {
      console.error('[Review] Frontend error:', err instanceof Error ? err.message : err)
      setReviewState('error')
    }
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="w-full text-center py-16 animate-fade-in">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <svg className="size-6" style={{ color: 'var(--muted)' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>No quiz available</p>
        <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>Upload a PDF to generate a quiz.</p>
        <button onClick={onReset} className="mt-6 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.97]" style={{ backgroundColor: '#6366F1' }}>
          Upload PDF
        </button>
      </div>
    )
  }

  return (
    <div className="w-full mx-auto space-y-5 animate-fade-in">
      {/* Score Card */}
      <div className="rounded-[18px] border p-5" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Your Score</p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text)', fontFamily: 'var(--font-sora)' }}>
              {score.correct}/{score.total}
              <span className="text-sm font-normal ml-1" style={{ color: 'var(--muted)' }}>({score.percentage}%)</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {allAnswered && (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ backgroundColor: 'var(--success-soft)', color: '#10B981' }}>
                <svg className="size-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Completed
              </span>
            )}
            <button onClick={onReset} className="rounded-xl border px-3.5 py-1.5 text-xs font-medium transition-colors" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
              New quiz
            </button>
          </div>
        </div>
        <div className="mt-3 h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
          <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${allAnswered ? score.percentage : (Object.keys(revealed).length / questions.length) * 100}%`, backgroundColor: '#6366F1' }} />
        </div>
        <div className="mt-1.5 flex justify-between text-[11px]" style={{ color: 'var(--muted)' }}>
          <span>{Object.keys(revealed).length} of {questions.length} answered</span>
          {allAnswered && score.percentage >= 70 && <span style={{ color: '#10B981' }}>Great job!</span>}
          {allAnswered && score.percentage < 70 && score.percentage >= 40 && <span style={{ color: '#F59E0B' }}>Keep practicing!</span>}
          {allAnswered && score.percentage < 40 && <span style={{ color: '#EF4444' }}>Review the material</span>}
        </div>
      </div>

      {/* Submit Button */}
      {!isLocked && (
        <div className="flex justify-center pt-1">
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="inline-flex items-center gap-1.5 rounded-xl px-8 py-3 text-sm font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-40"
            style={{ backgroundColor: '#6366F1', fontFamily: 'var(--font-sora)' }}
            onMouseEnter={(e) => { if (allAnswered) e.currentTarget.style.backgroundColor = '#4F46E5' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#6366F1' }}
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            {allAnswered ? 'Submit Quiz' : `Answer all questions to submit`}
          </button>
        </div>
      )}

      {isLocked && !reviews && (
        <div className="flex justify-center pt-1">
          <div className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium" style={{ backgroundColor: 'var(--accent-soft)', color: '#6366F1' }}>
            <div className="size-4 animate-spin rounded-full border-2" style={{ borderColor: 'var(--border)', borderTopColor: '#6366F1' }} />
            Submitting...
          </div>
        </div>
      )}

      {isLocked && reviews && (
        <div className="flex justify-center pt-1">
          <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: 'var(--success-soft)', color: '#10B981' }}>
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Quiz Submitted
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'JSON', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z', action: () => downloadJSON(questions) },
          { label: 'PDF', icon: 'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3', action: () => downloadPDF(questions) },
        ].map(({ label, icon, action }) => (
          <button key={label} onClick={action} className="inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium transition-colors" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
            <svg className="size-3.5" style={{ color: 'var(--muted)' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
            </svg>
            {label}
          </button>
        ))}
        <button onClick={handleShare} disabled={shareState === 'loading'} className="inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium transition-colors" style={{
          borderColor: shareState === 'copied' ? 'rgba(16,185,129,0.3)' : 'var(--border)',
          color: shareState === 'copied' ? '#10B981' : shareState === 'error' ? '#EF4444' : 'var(--text)',
          backgroundColor: shareState === 'copied' ? 'var(--success-soft)' : shareState === 'error' ? 'var(--error-soft)' : 'transparent',
        }}>
          {shareState === 'loading' ? <div className="size-3.5 animate-spin rounded-full border-2" style={{ borderColor: 'var(--border)', borderTopColor: '#6366F1' }} />
            : <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ color: 'var(--muted)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
            </svg>
          }
          {shareState === 'copied' ? 'Copied!' : shareState === 'error' ? 'Failed' : 'Share'}
        </button>
        {isLocked && !reviews && (
          <button
            onClick={handleReview}
            disabled={reviewState === 'loading'}
            className="inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium transition-colors"
            style={{
              borderColor: 'rgba(99,102,241,0.3)',
              color: reviewState === 'error' ? '#EF4444' : '#6366F1',
              backgroundColor: reviewState === 'loading' ? 'var(--accent-soft)' : 'var(--accent-soft)',
            }}
          >
            {reviewState === 'loading' ? (
              <div className="size-3.5 animate-spin rounded-full border-2" style={{ borderColor: 'var(--border)', borderTopColor: '#6366F1' }} />
            ) : (
              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
              </svg>
            )}
            {reviewState === 'loading' ? 'Analyzing...' : reviewState === 'error' ? 'Failed, try again' : 'Review Answers'}
          </button>
        )}
      </div>

      {reviews ? (
        <>
          {reviewStep === 'result' ? (
            <QuizResultScreen
              score={score}
              reviews={reviews}
              onViewFullReview={() => setReviewStep('review')}
              onReset={onReset}
            />
          ) : (
            <ReviewErrorBoundary onReset={onReset}>
              <QuizReview reviews={reviews} score={score} onReset={onReset} onBack={() => setReviewStep('result')} />
            </ReviewErrorBoundary>
          )}
          <SaveResultButton reviews={reviews} score={score} />
        </>
      ) : (
        <>
          {/* Questions */}
          <div className="space-y-3">
            {questions.map((q, i) => {
              const selected = revealed[i] ?? null
              const isCorrect = selected === q.answer
              const isAnswered = selected !== null
              const exp = explanations[i]
              const isLoading = explaining[i]
              const expErr = explainError[i]

              return (
                <div key={i} className="rounded-[18px] border p-5 transition-all duration-200" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: 'var(--accent-soft)', color: '#6366F1' }}>
                      Question {i + 1}
                    </span>
                    {isAnswered && (
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${isCorrect ? '' : ''}`} style={{ color: isCorrect ? '#10B981' : '#EF4444' }}>
                        <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          {isCorrect ? <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            : <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />}
                        </svg>
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text)' }}>{q.question}</p>

                  <div className="mt-3 space-y-1.5">
                    {Array.isArray(q.options) ? q.options.map((opt) => {
                      const isSelected = selected === opt
                      const isAnswer = q.answer === opt
                      let optStyle: React.CSSProperties = { borderColor: 'var(--border)', color: 'var(--text)' }
                      if (isAnswered) {
                        if (isAnswer) optStyle = { borderColor: 'rgba(16,185,129,0.4)', backgroundColor: 'var(--success-soft)', color: '#10B981' }
                        else if (isSelected && !isCorrect) optStyle = { borderColor: 'rgba(239,68,68,0.4)', backgroundColor: 'var(--error-soft)', color: '#EF4444' }
                        else optStyle = { borderColor: 'var(--border)', color: 'var(--muted)', opacity: 0.5 }
                      }

                      const optIndex = q.options.indexOf(opt)
                      const letter = optIndex >= 0 ? String.fromCharCode(65 + optIndex) : '?'

                      return (
                        <button key={opt} onClick={() => handleSelect(i, opt)} disabled={isAnswered}
                          className="w-full rounded-xl border px-3.5 py-2.5 text-left text-[13px] transition-all duration-150 active:scale-[0.99] flex items-start gap-2.5"
                          style={optStyle}
                        >
                          <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded text-[10px] font-semibold border" style={{
                            borderColor: isAnswered && isAnswer ? 'transparent' : isAnswered && isSelected && !isCorrect ? 'transparent' : 'var(--border)',
                            backgroundColor: isAnswered && isAnswer ? '#10B981' : isAnswered && isSelected && !isCorrect ? '#EF4444' : 'transparent',
                            color: isAnswered && (isAnswer || (isSelected && !isCorrect)) ? 'white' : 'var(--muted)',
                          }}>
                            {letter}
                          </span>
                          <span className="pt-0.5 leading-snug">{opt}</span>
                        </button>
                      )
                    }) : null}
                  </div>

                  {isAnswered && !isCorrect && (
                    <div className="mt-2.5 rounded-lg px-3 py-2 border text-xs" style={{ backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.2)', color: '#D97706' }}>
                      <span className="font-medium">Correct answer:</span> {q.answer}
                    </div>
                  )}

                  {isAnswered && !exp && !isLoading && !expErr && (
                    <button onClick={() => handleExplain(i)} className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-medium transition-colors" style={{ color: '#6366F1' }}>
                      <svg className="size-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                      </svg>
                      Explain this answer
                    </button>
                  )}

                  {isLoading && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--muted)' }}>
                      <div className="size-3 animate-spin rounded-full border-2" style={{ borderColor: 'var(--border)', borderTopColor: '#6366F1' }} />
                      Getting explanation...
                    </div>
                  )}

                  {expErr && <p className="mt-2 text-[11px]" style={{ color: '#EF4444' }}>{expErr}</p>}

                  {exp && (
                    <div className="mt-3 rounded-xl border p-4 animate-fade-in" style={{ borderColor: 'rgba(99,102,241,0.2)', backgroundColor: 'var(--accent-soft)' }}>
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border" style={{
                          color: exp.isCorrect ? '#10B981' : '#EF4444',
                          borderColor: exp.isCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
                          backgroundColor: exp.isCorrect ? 'var(--success-soft)' : 'var(--error-soft)',
                        }}>
                          {exp.isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                        <span className="text-[10px] font-medium" style={{ color: '#6366F1' }}>Teacher&apos;s Explanation</span>
                      </div>

                      <div className="flex gap-1 mb-2.5 overflow-x-auto scrollbar-none">
                        {(['base', 'en', 'fr', 'de', 'ar'] as const).map((lang) => {
                          const current = explainLang[i] || 'base'
                          return (
                            <button key={lang} onClick={() => setExplainLang((prev) => ({ ...prev, [i]: lang }))}
                              className="shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all active:scale-[0.97]"
                              style={{
                                backgroundColor: current === lang ? 'rgba(99,102,241,0.15)' : 'transparent',
                                color: current === lang ? '#6366F1' : 'var(--muted)',
                              }}
                            >
                              {lang === 'base' ? 'Base' : lang.toUpperCase()}
                            </button>
                          )
                        })}
                      </div>

                      {(() => {
                        const l = explainLang[i] || 'base'
                        const t = l === 'base' ? null : exp.translations?.[l as 'en' | 'fr' | 'de' | 'ar']
                        const sections: { label: string; text: string }[] = [
                          { label: 'Explanation', text: t ? t.explanation : exp.base },
                          { label: 'Grammar Rule', text: t ? t.grammarRule : exp.grammarRule },
                          { label: 'Example', text: t ? t.example : exp.example },
                          { label: 'Tip', text: t ? t.tip : exp.tip },
                        ]
                        return sections.map((s) => (
                          <div key={s.label} className={s.label !== 'Tip' ? 'mb-2' : ''}>
                            <p className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--muted)' }}>{s.label}</p>
                            <p className="text-xs" style={{ color: 'var(--text)', fontStyle: s.label === 'Example' ? 'italic' : 'normal' }}>
                              {s.text}
                            </p>
                          </div>
                        ))
                      })()}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Bottom CTA */}
          <div className="text-center pt-2 pb-8">
            <button onClick={onReset} className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.97]" style={{ backgroundColor: '#6366F1', fontFamily: 'var(--font-sora)' }}>
              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              Upload another PDF
            </button>
          </div>
        </>
      )}
    </div>
  )
}
