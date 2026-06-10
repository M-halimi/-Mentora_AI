'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'

interface QuizProcessingProps {
  isComplete?: boolean
  onTransitionToResults?: () => void
  onReset?: () => void
}

type StepState = 'pending' | 'active' | 'completed'

const STEPS = [
  { id: 'uploaded', label: 'PDF Uploaded' },
  { id: 'extracted', label: 'Content Extracted' },
  { id: 'analyzing', label: 'AI Analyzing Document' },
  { id: 'generating', label: 'Generating Quiz Questions' },
] as const

const STATUS_MESSAGES = [
  'Analyzing document structure...',
  'Understanding key concepts...',
  'Detecting important topics...',
  'Building question bank...',
  'Generating quiz questions...',
  'Finalizing results...',
]

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

const PARTICLES_COUNT = isMobileDevice() ? 4 : 12

function random(min: number, max: number) {
  return Math.random() * (max - min) + min
}

const EASE_OUT = [0.16, 1, 0.3, 1] as [number, number, number, number]

function useAnimatedCounter(target: number, duration: number = 2000, delay: number = 0) {
  const [value, setValue] = useState(target > 0 ? 0 : 0)

  useEffect(() => {
    if (target === 0) return

    let raf: number
    const startTime = performance.now() + delay

    function animate(time: number) {
      if (time < startTime) {
        raf = requestAnimationFrame(animate)
        return
      }
      const elapsed = time - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) {
        raf = requestAnimationFrame(animate)
      }
    }

    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, delay])

  return value
}

function useStatusCycle(interval: number = 2800) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setIndex(i => (i + 1) % STATUS_MESSAGES.length), interval)
    return () => clearInterval(timer)
  }, [interval])

  return index
}

function TimelineStep({ label, state, index, isPrevCompleted }: { label: string; state: StepState; index: number; isPrevCompleted: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        {index > 0 && (
          <motion.div
            className="w-px h-5"
            style={{ backgroundColor: isPrevCompleted ? 'var(--success)' : 'var(--border)' }}
          />
        )}
        <motion.div
          className="relative flex size-6 items-center justify-center rounded-full shrink-0"
          style={{
            backgroundColor:
              state === 'completed'
                ? 'var(--success)'
                : state === 'active'
                  ? 'var(--accent)'
                  : 'var(--border)',
            boxShadow:
              state === 'active'
                ? '0 0 16px rgba(99,102,241,0.35)'
                : state === 'completed'
                  ? '0 0 12px rgba(16,185,129,0.2)'
                  : 'none',
          }}
          animate={
            state === 'active'
              ? { scale: [1, 1.15, 1] }
              : state === 'completed'
                ? { scale: [1, 1.05, 1] }
                : {}
          }
          transition={
            state === 'active'
              ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
              : state === 'completed'
                ? { duration: 0.4 }
                : {}
          }
        >
          {state === 'completed' && <Check className="size-3 text-white" strokeWidth={3} />}
          {state === 'active' && (
            <motion.div
              className="size-1.5 rounded-full bg-white"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </motion.div>
        {index < STEPS.length - 1 && (
          <motion.div
            className="w-px flex-1 min-h-[20px]"
            style={{ backgroundColor: state === 'completed' ? 'var(--success)' : 'var(--border)' }}
          />
        )}
      </div>
      <motion.span
        className="text-sm font-medium leading-6"
        style={{
          color:
            state === 'completed'
              ? 'var(--success)'
              : state === 'active'
                ? 'var(--text)'
                : 'var(--muted)',
        }}
        animate={state === 'active' ? { x: [0, 2, 0] } : {}}
        transition={state === 'active' ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
      >
        {label}
      </motion.span>
    </div>
  )
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
          Progress
        </span>
        <motion.span
          className="text-xs font-semibold tabular-nums"
          style={{ color: 'var(--accent)' }}
          key={Math.round(value)}
        >
          {Math.round(value)}%
        </motion.span>
      </div>
      <div
        className="w-full h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--accent-soft)' }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #6366F1, #818CF8)',
            boxShadow: '0 0 8px rgba(99,102,241,0.3)',
          }}
          initial={{ width: '0%' }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        />
      </div>
    </div>
  )
}

function StatCard({ label, value, delay }: { label: string; value: number; delay?: number }) {
  const count = useAnimatedCounter(value, 2500, delay ?? 0)

  return (
    <motion.div
      className="rounded-2xl p-4 border"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--card-border)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (delay ?? 0) / 1000, duration: 0.5, ease: EASE_OUT }}
    >
      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>
        {label}
      </p>
      <p
        className="text-xl font-bold tabular-nums"
        style={{ color: 'var(--text)', fontFamily: 'var(--font-sora)' }}
      >
        {count}
      </p>
    </motion.div>
  )
}

function EstimatedTimeCard({ delay }: { delay: number }) {
  const count = useAnimatedCounter(30, 4000, delay)
  const remaining = Math.max(0, 30 - count)

  return (
    <motion.div
      className="rounded-2xl p-4 border"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--card-border)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000, duration: 0.5, ease: EASE_OUT }}
    >
      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>
        Estimated Completion
      </p>
      <p
        className="text-xl font-bold tabular-nums"
        style={{ color: 'var(--text)', fontFamily: 'var(--font-sora)' }}
      >
        ~{remaining}s
      </p>
    </motion.div>
  )
}

export function QuizProcessing({ isComplete, onTransitionToResults }: QuizProcessingProps) {
  const [stepStates, setStepStates] = useState<StepState[]>(() => {
    const arr: StepState[] = new Array(STEPS.length).fill('pending')
    arr[0] = 'completed'
    return arr
  })

  const [progress, setProgress] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const statusIndex = useStatusCycle()

  const [statTargets] = useState(() => ({
    pages: Math.floor(random(10, 18)),
    topics: Math.floor(random(6, 12)),
  }))

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLES_COUNT }, (_, i) => ({
        id: i,
        x: random(-30, 30),
        y: random(-30, 30),
        size: random(1.5, 4),
        duration: random(2.5, 5),
        delay: random(0, 3),
        xDelta: random(-20, 20),
        yDelta: random(-20, 20),
      })),
    [],
  )

  useEffect(() => {
    const timers = [
      setTimeout(() => {
        setStepStates(prev => {
          const n = [...prev]
          n[1] = 'completed'
          return n
        })
      }, 800),
      setTimeout(() => {
        setStepStates(prev => {
          const n = [...prev]
          n[2] = 'active'
          return n
        })
      }, 2000),
      setTimeout(() => {
        setStepStates(prev => {
          const n = [...prev]
          n[2] = 'completed'
          n[3] = 'active'
          return n
        })
      }, 4800),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    const duration = 10000
    const startTime = performance.now()
    let raf: number

    function animate(time: number) {
      const elapsed = time - startTime
      const raw = Math.min(elapsed / duration, 1)
      const eased = (1 - Math.pow(1 - raw, 3)) * 90
      setProgress(Math.min(eased, 90))
      if (raw < 1) {
        raf = requestAnimationFrame(animate)
      }
    }

    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    if (!isComplete) return

    const timer = setTimeout(() => {
      setProgress(100)
      setShowSuccess(true)
    }, 600)
    return () => clearTimeout(timer)
  }, [isComplete])

  useEffect(() => {
    if (!showSuccess) return
    const timer = setTimeout(() => onTransitionToResults?.(), 3000)
    return () => clearTimeout(timer)
  }, [showSuccess, onTransitionToResults])

  return (
    <div className="w-full animate-fade-in">
      <div className="mx-auto" style={{ maxWidth: 500 }}>
        <div className="mb-10">
          {STEPS.map((step, i) => (
            <TimelineStep
              key={step.id}
              label={step.label}
              state={stepStates[i]}
              index={i}
              isPrevCompleted={i > 0 ? stepStates[i - 1] === 'completed' : false}
            />
          ))}
        </div>

        <div className="flex justify-center mb-8">
          <div className="relative size-44 sm:size-48">
            <motion.div
              className="absolute inset-0 rounded-full border"
              style={{
                borderColor: 'rgba(99,102,241,0.12)',
                borderTopColor: 'rgba(99,102,241,0.5)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute rounded-full border"
              style={{
                inset: 10,
                borderColor: 'rgba(129,140,248,0.12)',
                borderTopColor: 'rgba(129,140,248,0.4)',
              }}
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute rounded-full border"
              style={{
                inset: 20,
                borderColor: 'rgba(99,102,241,0.08)',
                borderTopColor: 'rgba(99,102,241,0.35)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{
                inset: 28,
                background:
                  'radial-gradient(circle, rgba(99,102,241,0.5), rgba(99,102,241,0.12) 60%, transparent)',
                filter: 'blur(2px)',
              }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{
                inset: 34,
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.85), rgba(99,102,241,0.3))',
                filter: 'blur(1px)',
              }}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            {particles.map(p => (
              <motion.div
                key={p.id}
                className="absolute rounded-full"
                style={{
                  width: p.size,
                  height: p.size,
                  left: `calc(50% + ${p.x}px)`,
                  top: `calc(50% + ${p.y}px)`,
                  backgroundColor: '#818CF8',
                }}
                animate={{
                  x: [0, p.xDelta, 0],
                  y: [0, p.yDelta, 0],
                  opacity: [0, 0.7, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        </div>

        <div className="h-7 flex items-center justify-center mb-8">
          <AnimatePresence mode="wait">
            <motion.p
              key={statusIndex}
              className="text-sm text-center"
              style={{ color: 'var(--muted)' }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
            >
              {STATUS_MESSAGES[statusIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="mb-10">
          <ProgressBar value={progress} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Pages Processed" value={statTargets.pages} delay={200} />
          <StatCard label="Topics Detected" value={statTargets.topics} delay={400} />
          <StatCard label="Questions Generated" value={10} delay={600} />
          <EstimatedTimeCard delay={800} />
        </div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-5"
            style={{
              backgroundColor: 'rgba(0,0,0,0.25)',
              backdropFilter: prefersReducedMotion() ? 'none' : 'blur(10px)',
              WebkitBackdropFilter: prefersReducedMotion() ? 'none' : 'blur(10px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="flex flex-col items-center gap-6 p-8 sm:p-10 rounded-3xl w-full max-w-sm"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--card-border)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.12)',
              }}
              initial={{ scale: 0.9, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5, ease: EASE_OUT }}
            >
              <motion.div
                className="flex size-14 items-center justify-center rounded-full"
                style={{
                  backgroundColor: 'var(--success-soft)',
                  boxShadow: '0 0 40px rgba(16,185,129,0.15)',
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.35, type: 'spring', stiffness: 180, damping: 14 }}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.55, type: 'spring', stiffness: 250, damping: 10 }}
                >
                  <Check className="size-7" color="#10B981" strokeWidth={3} />
                </motion.div>
              </motion.div>

              <div className="text-center">
                <h2
                  className="text-2xl font-bold mb-1.5"
                  style={{ color: 'var(--text)', fontFamily: 'var(--font-sora)' }}
                >
                  Your quiz is ready
                </h2>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--muted)', maxWidth: 260 }}
                >
                  The AI successfully analyzed your document and generated personalized
                  questions.
                </p>
              </div>

              <motion.div
                className="h-1 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--accent-soft)', width: 200, maxWidth: '100%' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #6366F1, #818CF8)',
                  }}
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2.8, ease: 'linear' }}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
