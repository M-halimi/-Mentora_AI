import { QuizQuestion } from '@/types'
import { generateQuiz as groqGenerate } from '@/lib/groq'
import { generateQuizViaOpenRouter } from '@/lib/openrouter'

export async function generateQuiz(text: string): Promise<QuizQuestion[]> {
  try {
    return await groqGenerate(text)
  } catch (groqErr) {
    const groqMessage =
      groqErr instanceof Error ? groqErr.message : 'Groq failed'

    console.warn('[QuizGenerator] Groq failed, falling back to OpenRouter:', groqMessage)

    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('Groq failed and no OPENROUTER_API_KEY configured for fallback')
    }

    try {
      return await generateQuizViaOpenRouter(text)
    } catch (orErr) {
      const orMessage =
        orErr instanceof Error ? orErr.message : 'OpenRouter failed'

      console.error('[QuizGenerator] Both providers failed:', { groq: groqMessage, openrouter: orMessage })
      throw new Error(`Quiz generation failed: Groq (${groqMessage}), OpenRouter (${orMessage})`)
    }
  }
}
