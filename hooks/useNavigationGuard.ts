'use client'

import { useEffect, useRef } from 'react'
import { saveSnapshot, loadSnapshot, clearSnapshot } from '@/lib/quiz-session'
import { QuizQuestion, QuizConfig } from '@/types'

interface QuizProgress {
  questions: QuizQuestion[]
  revealed: Record<number, string>
  step: string
  config: QuizConfig | null
}

export function useNavigationGuard(
  isActive: boolean,
  progress: QuizProgress | null
) {
  const progressRef = useRef(progress)
  progressRef.current = progress

  useEffect(() => {
    if (!isActive || !progress) return

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (progressRef.current) {
        saveSnapshot(progressRef.current)
      }
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isActive, progress])

  function getSavedProgress(): QuizProgress & { timestamp: number } | null {
    return loadSnapshot()
  }

  function clearSavedProgress(): void {
    clearSnapshot()
  }

  return { getSavedProgress, clearSavedProgress }
}
