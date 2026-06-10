import { QuizQuestion, QuizConfig } from '@/types'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

function buildPrompt(config: QuizConfig): string {
  const difficultyInstruction = {
    easy: 'Questions should be straightforward, testing basic understanding.',
    medium: 'Questions should require moderate comprehension and application.',
    hard: 'Questions should be challenging, requiring deep analysis and synthesis.',
    mixed: 'Mix of easy, medium, and hard questions for balanced difficulty.',
  }[config.difficulty]

  const modeInstruction = config.mode === 'exam'
    ? 'Do NOT include any hints or explanations in the output. Return only the JSON array of questions.'
    : ''

  return `
You are an expert language teacher and quiz generator.

STRICT RULES:
- Return ONLY valid JSON
- Exactly ${config.numQuestions} MCQ questions
- Each question has exactly 4 options
- Only one correct answer per question
- The "answer" field must be the FULL TEXT of the correct option
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
`
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function cleanJSON(text: string) {
  return text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim()
}

export async function callOpenRouter(
  messages: { role: string; content: string }[],
  options?: {
    model?: string
    temperature?: number
    max_tokens?: number
  },
  retries = 2
): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('Missing OPENROUTER_API_KEY in environment variables')
  }

  const model = options?.model ?? 'meta-llama/llama-3.1-8b-instruct'
  const temperature = options?.temperature ?? 0.2
  const max_tokens = options?.max_tokens ?? 6000

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Teacher Copilot',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens,
        }),
      })

      if (!res.ok) {
        const errorText = await res.text().catch(() => '')
        throw new Error(`OpenRouter ${res.status}: ${errorText.slice(0, 200)}`)
      }

      const json = await res.json()
      const content = json.choices?.[0]?.message?.content

      if (!content) {
        throw new Error('Empty response from OpenRouter')
      }

      return cleanJSON(content)
    } catch (err) {
      if (attempt <= retries) {
        console.warn(
          `[OpenRouter] Attempt ${attempt} failed. Retrying...`,
          err instanceof Error ? err.message : err
        )
        await sleep(1000 * attempt)
        continue
      }
      throw err
    }
  }

  throw new Error('Failed after all retry attempts')
}

export async function generateQuizViaOpenRouter(
  text: string,
  config: QuizConfig
): Promise<QuizQuestion[]> {
  try {
    const truncated = text.slice(0, 12000)

    const content = await callOpenRouter(
      [
        {
          role: 'system',
          content: 'You are a strict JSON quiz generator.',
        },
        {
          role: 'user',
          content: buildPrompt(config) + truncated,
        },
      ],
      { model: 'meta-llama/llama-3.1-8b-instruct', temperature: 0.2, max_tokens: 6000 }
    )

    let parsed

    try {
      parsed = JSON.parse(content)
    } catch {
      console.log('RAW RESPONSE:', content)
      throw new Error('Invalid JSON returned by AI')
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('OpenRouter returned empty or invalid quiz format')
    }

    return parsed
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'OpenRouter failed completely'

    console.error('[OpenRouter FINAL ERROR]', message)

    throw new Error(message)
  }
}
