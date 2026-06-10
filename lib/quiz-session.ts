import { QuizQuestion, QuestionReview, QuizConfig } from '@/types'

const KEYS = {
  questions: 'quizQuestions',
  revealed: 'quizRevealed',
  config: 'quizConfig',
  timerRemaining: 'quizTimerRemaining',
  timerStart: 'quizTimerStart',
  timerDuration: 'quizTimerDuration',
  snapshot: 'quizSnapshot',
} as const

function getItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function setItem(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

function removeItem(key: string): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(key)
  } catch {}
}

export function getSubmittedKey(questions: QuizQuestion[]): string {
  const hash = questions.map(q => q.question).join('|').length.toString(36)
  return `quizSubmitted_${hash}`
}

export function getAnalysisKey(questions: QuizQuestion[]): string {
  const hash = questions.map(q => q.question).join('|').length.toString(36)
  return `quizAnalysis_${hash}`
}

export function saveQuestions(questions: QuizQuestion[]): void {
  setItem(KEYS.questions, questions)
}

export function loadQuestions(): QuizQuestion[] | null {
  return getItem<QuizQuestion[]>(KEYS.questions)
}

export function saveRevealed(revealed: Record<number, string>): void {
  setItem(KEYS.revealed, revealed)
}

export function loadRevealed(): Record<number, string> | null {
  return getItem<Record<number, string>>(KEYS.revealed)
}

export function saveConfig(config: QuizConfig): void {
  setItem(KEYS.config, config)
}

export function loadConfig(): QuizConfig | null {
  return getItem<QuizConfig>(KEYS.config)
}

export function saveTimerState(remaining: number, start: number, duration: number): void {
  setItem(KEYS.timerRemaining, remaining)
  setItem(KEYS.timerStart, start)
  setItem(KEYS.timerDuration, duration)
}

export function loadTimerState(): { remaining: number; start: number; duration: number } | null {
  const remaining = getItem<number>(KEYS.timerRemaining)
  const start = getItem<number>(KEYS.timerStart)
  const duration = getItem<number>(KEYS.timerDuration)
  if (remaining == null || start == null || duration == null) return null
  return { remaining, start, duration }
}

export function clearTimerState(): void {
  removeItem(KEYS.timerRemaining)
  removeItem(KEYS.timerStart)
  removeItem(KEYS.timerDuration)
}

export function markSubmitted(questions: QuizQuestion[]): void {
  setItem(getSubmittedKey(questions), true)
}

export function isSubmitted(questions: QuizQuestion[]): boolean {
  return getItem<boolean>(getSubmittedKey(questions)) === true
}

export function saveAnalysis(questions: QuizQuestion[], data: unknown): void {
  setItem(getAnalysisKey(questions), data)
}

export function loadAnalysis<T>(questions: QuizQuestion[]): T | null {
  return getItem<T>(getAnalysisKey(questions))
}

export function saveSnapshot(state: {
  questions: QuizQuestion[]
  revealed: Record<number, string>
  step: string
  config: QuizConfig | null
}): void {
  setItem(KEYS.snapshot, { ...state, timestamp: Date.now() })
}

export function loadSnapshot(): {
  questions: QuizQuestion[]
  revealed: Record<number, string>
  step: string
  config: QuizConfig | null
  timestamp: number
} | null {
  return getItem(KEYS.snapshot)
}

export function clearSnapshot(): void {
  removeItem(KEYS.snapshot)
}

export function clearAllQuizSession(): void {
  Object.values(KEYS).forEach(removeItem)
}
