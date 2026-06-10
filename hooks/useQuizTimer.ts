'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { saveTimerState, loadTimerState, clearTimerState } from '@/lib/quiz-session'

interface TimerCallbacks {
  onAutoSubmit: () => void
}

interface TimerState {
  remaining: number
  total: number
  isRunning: boolean
  phase: 'normal' | 'warning' | 'critical'
}

const WARNING_THRESHOLD = 5 * 60
const CRITICAL_THRESHOLD = 2 * 60
const AUTO_SAVE_INTERVAL = 10_000
const TICK_INTERVAL = 1_000

export function useQuizTimer(
  durationSeconds: number,
  callbacks: TimerCallbacks,
  startImmediately: boolean
) {
  const [state, setState] = useState<TimerState>(() => {
    const saved = loadTimerState()
    if (saved) {
      const elapsed = Math.floor((Date.now() - saved.start) / 1000)
      const remaining = Math.max(0, saved.remaining - elapsed)
      const phase = getPhase(remaining)
      return { remaining, total: saved.duration, isRunning: remaining > 0, phase }
    }
    return { remaining: durationSeconds, total: durationSeconds, isRunning: false, phase: 'normal' }
  })

  const stateRef = useRef(state)
  stateRef.current = state

  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasAutoSubmittedRef = useRef(false)

  function getPhase(remaining: number): TimerState['phase'] {
    if (remaining <= CRITICAL_THRESHOLD) return 'critical'
    if (remaining <= WARNING_THRESHOLD) return 'warning'
    return 'normal'
  }

  const start = useCallback(() => {
    if (intervalRef.current) return
    const now = Date.now()
    saveTimerState(stateRef.current.remaining, now, stateRef.current.total)

    intervalRef.current = setInterval(() => {
      setState(prev => {
        const next = prev.remaining - 1
        if (next <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          if (autoSaveRef.current) clearInterval(autoSaveRef.current)
          if (!hasAutoSubmittedRef.current) {
            hasAutoSubmittedRef.current = true
            setTimeout(() => callbacksRef.current.onAutoSubmit(), 0)
          }
          clearTimerState()
          return { ...prev, remaining: 0, isRunning: false, phase: 'critical' }
        }
        return { ...prev, remaining: next, phase: getPhase(next) }
      })
    }, TICK_INTERVAL)

    autoSaveRef.current = setInterval(() => {
      saveTimerState(stateRef.current.remaining, Date.now(), stateRef.current.total)
    }, AUTO_SAVE_INTERVAL)
  }, [])

  useEffect(() => {
    if (startImmediately && state.remaining > 0) {
      start()
    }
  }, [startImmediately, start, state.remaining])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (autoSaveRef.current) clearInterval(autoSaveRef.current)
    }
  }, [])

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const formatted = formatTime(state.remaining)
  const progress = state.total > 0 ? state.remaining / state.total : 1

  return {
    remaining: state.remaining,
    total: state.total,
    formatted,
    progress,
    isRunning: state.isRunning,
    phase: state.phase,
    start,
  }
}
