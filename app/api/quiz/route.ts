import { NextRequest, NextResponse } from 'next/server'
import { saveQuiz } from '@/lib/quiz-store'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const questions = body?.questions

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Questions required' },
        { status: 400 },
      )
    }

    const quizId = saveQuiz(questions)

    return NextResponse.json({ success: true, data: { quizId } })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create share link' },
      { status: 500 },
    )
  }
}
