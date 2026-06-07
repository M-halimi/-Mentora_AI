import { generateResponse } from '@/lib/ai-provider-manager'
import { QuizQuestion } from '@/types'

export async function generateQuiz(text: string): Promise<QuizQuestion[]> {
  return generateResponse(text)
}
