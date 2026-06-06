import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY! })

const EXPLAIN_PROMPT = `You are an expert language teacher.

I will give you:
1. A question
2. Correct answer
3. User answer

Your task is to analyze the mistake and generate a learning explanation.

OUTPUT RULES:
- Return ONLY valid JSON
- No markdown, no extra text
- Keep explanations short and simple
- Focus on learning

YOU MUST RETURN THIS FORMAT:

{
  "status": "Correct or Incorrect",

  "explanation": {
    "base": "Short explanation in simple neutral form (no language-specific words)",
    "fr": "Same explanation translated into French",
    "en": "Same explanation translated into English",
    "de": "Same explanation translated into German",
    "ar": "Same explanation translated into Arabic"
  },

  "grammar_rule": {
    "base": "Grammar rule in neutral form",
    "fr": "Rule in French",
    "en": "Rule in English",
    "de": "Rule in German",
    "ar": "Rule in Arabic"
  },

  "example": {
    "base": "Simple example sentence",
    "fr": "Example in French",
    "en": "Example in English",
    "de": "Example in German",
    "ar": "Example in Arabic"
  },

  "tip": {
    "base": "Practice tip",
    "fr": "Tip in French",
    "en": "Tip in English",
    "de": "Tip in German",
    "ar": "Tip in Arabic"
  }
}

IMPORTANT:
- Keep meaning EXACT across languages
- Do NOT add extra text outside JSON
- Make translations consistent (same idea, not different meaning)
- Keep everything short and beginner-friendly
- Focus on education, not long explanations`

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

    const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim()
    const explanation = JSON.parse(cleaned)

    return NextResponse.json({ success: true, data: explanation })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to generate explanation' },
      { status: 500 },
    )
  }
}
