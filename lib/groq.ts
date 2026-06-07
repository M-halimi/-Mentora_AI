import Groq from 'groq-sdk'
import { QuizQuestion } from '@/types'

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

async function fetchWithRetry(
  text: string,
  retries = 2
): Promise<QuizQuestion[]> {
  const truncated = text.slice(0, 12000)

  const prompt = `
You are an expert language teacher and quiz generator.

STRICT RULES:
- Return ONLY valid JSON
- Exactly 10 MCQ questions
- Each question has exactly 4 options
- Only one correct answer per question
- The "answer" field must be the FULL TEXT of the correct option, not a letter
- No explanations, no markdown

FORMAT:
[
  {
    "question": "What is the capital of France?",
    "options": ["London", "Paris", "Berlin", "Madrid"],
    "answer": "Paris"
  }
]

LESSON:
${truncated}
`

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a strict JSON quiz generator.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
      })

      const content = completion.choices[0]?.message?.content

      if (!content) {
        throw new Error('Empty response from Groq')
      }

      const cleaned = content
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim()

      const parsed = JSON.parse(cleaned)

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('AI returned empty or invalid quiz format')
      }

      return parsed
    } catch (err) {
      if (attempt <= retries) {
        console.warn(
          `[Groq] Attempt ${attempt} failed, retrying...`,
          err instanceof Error ? err.message : err
        )
        await new Promise((r) => setTimeout(r, 1000 * attempt))
        continue
      }
      throw err
    }
  }

  throw new Error('Failed to generate quiz after retries')
}

export async function generateQuiz(text: string): Promise<QuizQuestion[]> {
  try {
    return await fetchWithRetry(text)
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Quiz generation failed'
    console.error('[Groq] Final error:', message)
    throw new Error(message)
  }
}
