import { QuizQuestion } from '@/types'

const store = new Map<string, QuizQuestion[]>()

export function saveQuiz(questions: QuizQuestion[]): string {
  const id = crypto.randomUUID()
  store.set(id, questions)
  setTimeout(() => store.delete(id), 1000 * 60 * 60)
  return id
}

export function getQuiz(id: string): QuizQuestion[] | null {
  return store.get(id) ?? null
}
