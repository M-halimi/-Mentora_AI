import { z } from 'zod'

export const FILE_MAX_SIZE = 30 * 1024 * 1024
export const FILE_ALLOWED_TYPES = ['application/pdf']

export function validateUploadFile(file: { type: string; size: number }): string | null {
  if (!FILE_ALLOWED_TYPES.includes(file.type)) {
    return 'Only PDF files are allowed'
  }
  if (file.size > FILE_MAX_SIZE) {
    return 'File must be under 30MB'
  }
  return null
}

export const QuizQuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).length(4),
  answer: z.string().min(1),
})

export const QuizResponseSchema = z.array(QuizQuestionSchema).length(10)
