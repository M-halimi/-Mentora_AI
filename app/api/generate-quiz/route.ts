import { NextRequest, NextResponse } from 'next/server'
import { generateQuiz } from '@/lib/quiz-generator'
import { withRateLimit } from '@/lib/rate-limit'

async function handler(req: NextRequest) {
  const start = Date.now()
  console.log('[QuizGen API] POST /api/generate-quiz started')

  try {
    let body: { text?: string; numQuestions?: number; difficulty?: string; mode?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body. Expected JSON with a "text" field.' },
        { status: 400 },
      )
    }

    const text = body?.text

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'No text provided for quiz generation. Please upload a PDF with readable text.' },
        { status: 400 },
      )
    }

    if (text.trim().length < 50) {
      return NextResponse.json(
        { success: false, error: 'Extracted text is too short to generate a quiz (minimum 50 characters).' },
        { status: 400 },
      )
    }

    const numQuestions = [10, 15, 20, 25].includes(body.numQuestions ?? 10)
      ? (body.numQuestions as 10 | 15 | 20 | 25)
      : 10

    const difficulty = ['easy', 'medium', 'hard', 'mixed'].includes(body.difficulty ?? 'mixed')
      ? (body.difficulty as 'easy' | 'medium' | 'hard' | 'mixed')
      : 'mixed'

    const mode = ['practice', 'exam'].includes(body.mode ?? 'practice')
      ? (body.mode as 'practice' | 'exam')
      : 'practice'

    console.log('[QuizGen API] Text length:', text.length, `Config: ${numQuestions}Q, ${difficulty}, ${mode}`)

    const quiz = await generateQuiz(text, { numQuestions, difficulty, mode })

    const questions = Array.isArray(quiz) ? quiz : []

    if (questions.length === 0) {
      throw new Error('Quiz generation returned no questions')
    }

    console.log('[QuizGen API] Success, questions:', questions.length, `(${Date.now() - start}ms)`)

    return NextResponse.json({
      success: true,
      data: { questions },
    })
  } catch (err: unknown) {
    const elapsed = Date.now() - start
    const message = err instanceof Error ? err.message : 'Quiz generation failed'
    console.error(`[QuizGen API] Error after ${elapsed}ms:`, err)

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    )
  }
}

export const POST = withRateLimit(handler)
