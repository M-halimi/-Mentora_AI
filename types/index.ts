export interface QuizQuestion {
  question: string
  options: [string, string, string, string]
  answer: string
}

export interface ApiError {
  code: string
  message: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
}

export type UploadResponse = ApiResponse<{ text: string }>
export type GenerateQuizResponse = ApiResponse<{ questions: QuizQuestion[] }>

export interface TranslatableContent {
  base: string
  fr: string
  en: string
  de: string
  ar: string
}

export interface Explanation {
  status: string
  explanation: TranslatableContent
  grammar_rule: TranslatableContent
  example: TranslatableContent
  tip: TranslatableContent
}
