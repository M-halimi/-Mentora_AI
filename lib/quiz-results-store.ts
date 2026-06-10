import { StudentResult } from '@/types'

const STORAGE_KEY = 'teacher-copilot-results'

export function saveResult(result: StudentResult): void {
  if (typeof window === 'undefined') return
  try {
    const existing = getAllResults()
    existing.push(result)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
  } catch {
    console.warn('[QuizResultsStore] Failed to save result')
  }
}

export function getAllResults(): StudentResult[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as StudentResult[]
  } catch {
    return []
  }
}

export function clearAllResults(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    console.warn('[QuizResultsStore] Failed to clear results')
  }
}
