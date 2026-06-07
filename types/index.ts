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

export interface ExplainTranslation {
  explanation: string
  grammarRule: string
  example: string
  tip: string
}

export interface Explanation {
  isCorrect: boolean
  correctAnswer: string
  userAnswer: string
  base: string
  grammarRule: string
  example: string
  tip: string
  translations: {
    en: ExplainTranslation
    fr: ExplainTranslation
    de: ExplainTranslation
    ar: ExplainTranslation
  }
}

export interface QuestionReview {
  question: string
  options: string[]
  correctIndex: number
  userIndex: number
  isCorrect: boolean
  userAnswer: string
  correctAnswer: string
  explanation: string
  grammarRule: string
  example: string
  tip: string
}
