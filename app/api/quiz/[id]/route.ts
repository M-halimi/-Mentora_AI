import { NextRequest, NextResponse } from 'next/server'
import { getQuiz } from '@/lib/quiz-store'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const questions = getQuiz(id)

  if (!questions) {
    return NextResponse.json(
      { success: false, error: 'Quiz not found or expired' },
      { status: 404 },
    )
  }

  return NextResponse.json({ success: true, data: { questions } })
}
