import { generateResponse } from '@/lib/ai-provider-manager'
import { QuizQuestion, QuizConfig } from '@/types'

export async function generateQuiz(text: string, config?: QuizConfig): Promise<QuizQuestion[]> {
  return generateResponse(text, config ?? { numQuestions: 10, difficulty: 'mixed', mode: 'practice' })
}
