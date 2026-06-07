import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY! })

const EXPLAIN_PROMPT = `You are an expert language teacher assistant.

A student just completed a quiz question. Analyze it and return a single JSON object.

Return the explanation in 4 languages: English (en), French (fr), German (de), and Arabic (ar).

Return exactly this structure:
{
  "isCorrect": true,
  "correctAnswer": "the correct option text",
  "userAnswer": "what the student picked",
  "base": "simple one sentence — correct or wrong feedback",
  "grammarRule": "short rule max 6 words",
  "example": "one short example sentence",
  "tip": "one practical tip",
  "translations": {
    "en": {
      "explanation": "explanation in English",
      "grammarRule": "rule in English",
      "example": "example in English",
      "tip": "tip in English"
    },
    "fr": {
      "explanation": "explanation in French",
      "grammarRule": "rule in French",
      "example": "example in French",
      "tip": "tip in French"
    },
    "de": {
      "explanation": "explanation in German",
      "grammarRule": "rule in German",
      "example": "example in German",
      "tip": "tip in German"
    },
    "ar": {
      "explanation": "explanation in Arabic",
      "grammarRule": "rule in Arabic",
      "example": "example in Arabic",
      "tip": "tip in Arabic"
    }
  }
}

RULES:
- Return ONLY valid JSON, no markdown, no backticks, no extra text
- base field: if correct say "The user answered correctly." if wrong say "The correct answer is [correctAnswer]."
- grammarRule and example and tip at root level → write in the same language as the question
- All 4 translations must always be present`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { question, correctAnswer, userAnswer } = body

    if (!question || !correctAnswer || !userAnswer) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 },
      )
    }

    const prompt = `Question:\n${question}\n\nCorrect answer:\n${correctAnswer}\n\nUser answer:\n${userAnswer}`

    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: EXPLAIN_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('Empty response')

    const start = content.indexOf('{')
    const end = content.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) {
      throw new Error('No JSON object found in response')
    }
    const explanation = JSON.parse(content.slice(start, end + 1))

    return NextResponse.json({ success: true, data: explanation })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to generate explanation' },
      { status: 500 },
    )
  }
}
