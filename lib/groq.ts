import Groq from 'groq-sdk'
import { QuizQuestion, QuizConfig } from '@/types'

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

function annotateError(err: unknown): Error {
  if (err instanceof Error) {
    const annotated = err as Error & { status?: number; code?: string }
    const raw = err as unknown as Record<string, unknown>
    if (raw.status && typeof raw.status === 'number') {
      annotated.status = raw.status as number
    }
    return annotated
  }
  return err instanceof Error ? err : new Error(String(err))
}

async function fetchWithRetry(
  text: string,
  config: QuizConfig,
  retries = 2
): Promise<QuizQuestion[]> {
  const truncated = text.slice(0, 12000)

  const difficultyInstruction = {
    easy: 'Questions should be straightforward, testing basic understanding.',
    medium: 'Questions should require moderate comprehension and application.',
    hard: 'Questions should be challenging, requiring deep analysis and synthesis.',
    mixed: 'Mix of easy, medium, and hard questions for balanced difficulty.',
  }[config.difficulty]

  const modeInstruction = config.mode === 'exam'
    ? 'Do NOT include any hints or explanations in the output. Return only the JSON array of questions.'
    : ''

  const prompt = `
You are an expert language teacher and quiz generator.

STRICT RULES:
- Return ONLY valid JSON
- Exactly ${config.numQuestions} MCQ questions
- Each question has exactly 4 options
- Only one correct answer per question
- The "answer" field must be the FULL TEXT of the correct option, not a letter
- No explanations, no markdown
- ${difficultyInstruction}
- ${modeInstruction}

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
    } catch (raw) {
      const err = annotateError(raw)
      if (attempt <= retries) {
        console.warn(
          `[Groq] Attempt ${attempt} failed, retrying...`,
          err.message
        )
        await new Promise((r) => setTimeout(r, 1000 * attempt))
        continue
      }
      throw err
    }
  }

  throw new Error('Failed to generate quiz after retries')
}

export async function generateQuiz(text: string, config: QuizConfig): Promise<QuizQuestion[]> {
  try {
    return await fetchWithRetry(text, config)
  } catch (raw) {
    const err = annotateError(raw)
    console.error('[Groq] Final error:', err.message)
    throw err
  }
}
