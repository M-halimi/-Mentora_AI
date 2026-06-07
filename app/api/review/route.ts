import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY! })

const REVIEW_PROMPT = `You are an expert language teacher assistant.

A student just completed a quiz. I will give you the quiz questions, all answer options, the correct answer index, and the student's answer index.

Your job is to analyze every question and return a complete JSON array.

LANGUAGE RULE:
- Detect the language of the quiz questions automatically
- Write ALL fields (explanation, grammarRule, example, tip) in that same language
- If Arabic → respond in Arabic
- If French → respond in French  
- If German → respond in German
- If English → respond in English

For EACH question return exactly:
{
  "question": "the question text",
  "options": ["A", "B", "C", "D"],
  "correctIndex": 1,
  "userIndex": 2,
  "isCorrect": false,
  "userAnswer": "the option the student picked",
  "correctAnswer": "the correct option text",
  "explanation": "why this answer is correct, 2-3 simple sentences",
  "grammarRule": "short rule label max 6 words",
  "example": "one short example sentence",
  "tip": "one practical tip to remember this"
}

RULES:
- Return ONLY a valid JSON array, nothing else
- No markdown, no backticks, no intro text, no extra fields
- Every question must appear in the array, correct and wrong ones
- isCorrect is true only if userIndex === correctIndex
- userAnswer and correctAnswer must be the actual text from options array, not the index

Here is the quiz data:
{{QUIZ_DATA}}`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { questions, userAnswers } = body

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Questions required' },
        { status: 400 },
      )
    }

    if (!userAnswers || typeof userAnswers !== 'object') {
      return NextResponse.json(
        { success: false, error: 'userAnswers object required' },
        { status: 400 },
      )
    }

    const quizData = questions.map((q: any, i: number) => ({
      question: q.question,
      options: q.options,
      correctIndex: q.options.indexOf(q.answer),
      userIndex: q.options.indexOf(userAnswers[i] ?? ''),
      userAnswer: userAnswers[i] ?? '',
    }))

    const prompt = REVIEW_PROMPT.replace('{{QUIZ_DATA}}', JSON.stringify(quizData, null, 2))

    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are an expert language teacher assistant that detects quiz language and returns only valid JSON arrays.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('Empty response')

    const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim()
    const reviews = JSON.parse(cleaned)

    if (!Array.isArray(reviews)) {
      throw new Error('Response is not an array')
    }

    const normalized = reviews.map((r: any) => ({
      question: r.question ?? '',
      options: Array.isArray(r.options) ? r.options : [],
      correctIndex: typeof r.correctIndex === 'number' ? r.correctIndex : -1,
      userIndex: typeof r.userIndex === 'number' ? r.userIndex : -1,
      isCorrect: r.isCorrect === true,
      userAnswer: r.userAnswer ?? '',
      correctAnswer: r.correctAnswer ?? '',
      explanation: r.explanation ?? '',
      grammarRule: r.grammarRule ?? '',
      example: r.example ?? '',
      tip: r.tip ?? '',
    }))

    return NextResponse.json({ success: true, data: normalized })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Review generation failed' },
      { status: 500 },
    )
  }
}
