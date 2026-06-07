import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { callOpenRouter } from '@/lib/openrouter'

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

function makeReviewMessages(prompt: string) {
  return [
    {
      role: 'system' as const,
      content: 'You are an expert language teacher assistant that detects quiz language and returns only valid JSON arrays.',
    },
    {
      role: 'user' as const,
      content: prompt,
    },
  ]
}

async function tryGroq(prompt: string, requestId: string): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set')
  }

  const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

  console.log(`[Review:${requestId}] Groq: sending request`)
  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: makeReviewMessages(prompt) as any,
    temperature: 0.3,
  })

  const content = completion.choices[0]?.message?.content
  if (!content) {
    throw new Error('Empty response from Groq')
  }

  console.log(`[Review:${requestId}] Groq: received response (${content.length} chars)`)
  return content
}

async function tryOpenRouter(prompt: string, requestId: string): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set')
  }

  console.log(`[Review:${requestId}] OpenRouter: sending request`)
  const content = await callOpenRouter(
    makeReviewMessages(prompt),
    {
      model: 'meta-llama/llama-3.1-8b-instruct',
      temperature: 0.3,
      max_tokens: 8000,
    }
  )

  console.log(`[Review:${requestId}] OpenRouter: received response (${content.length} chars)`)
  return content
}

function extractJSON(content: string): string {
  const start = content.indexOf('[')
  const end = content.lastIndexOf(']')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON array found in response')
  }
  return content.slice(start, end + 1)
}

export async function POST(req: NextRequest) {
  const requestId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  console.log(`[Review:${requestId}] STEP 1: POST /api/review started`)

  try {
    console.log(`[Review:${requestId}] STEP 2: Parsing request body`)
    let body: any
    try {
      body = await req.json()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to parse request body'
      console.error(`[Review:${requestId}] STEP 2 FAILED: ${msg}`)
      return NextResponse.json({
        success: false,
        stage: 'parse_body',
        error: msg,
      }, { status: 400 })
    }

    const { questions, userAnswers } = body
    console.log(`[Review:${requestId}] STEP 2 DONE: questions=${questions?.length ?? 0}, userAnswers=${Object.keys(userAnswers ?? {}).length} keys`)

    console.log(`[Review:${requestId}] STEP 3: Validating inputs`)
    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({
        success: false,
        stage: 'validate_questions',
        error: 'Questions required',
      }, { status: 400 })
    }
    if (!userAnswers || typeof userAnswers !== 'object') {
      return NextResponse.json({
        success: false,
        stage: 'validate_userAnswers',
        error: 'userAnswers object required',
      }, { status: 400 })
    }
    console.log(`[Review:${requestId}] STEP 3 DONE: ${questions.length} questions validated`)

    console.log(`[Review:${requestId}] STEP 4: Building quizData`)
    const quizData = questions.map((q: any, i: number) => ({
      question: q.question,
      options: q.options,
      correctIndex: q.options.indexOf(q.answer),
      userIndex: q.options.indexOf(userAnswers[i] ?? ''),
      userAnswer: userAnswers[i] ?? '',
    }))
    console.log(`[Review:${requestId}] STEP 4 DONE: quizData[${quizData.length}]`)

    console.log(`[Review:${requestId}] STEP 5: Building prompt`)
    const prompt = REVIEW_PROMPT.replace('{{QUIZ_DATA}}', JSON.stringify(quizData, null, 2))
    console.log(`[Review:${requestId}] STEP 5 DONE: prompt length=${prompt.length}`)

    console.log(`[Review:${requestId}] STEP 6: Trying Groq`)
    let rawContent: string
    try {
      rawContent = await tryGroq(prompt, requestId)
      console.log(`[Review:${requestId}] STEP 6 SUCCESS: Groq responded`)
    } catch (groqErr) {
      const groqMsg = groqErr instanceof Error ? groqErr.message : String(groqErr)
      console.warn(`[Review:${requestId}] STEP 6 FAILED: Groq error: ${groqMsg}`)

      console.log(`[Review:${requestId}] STEP 7: Falling back to OpenRouter`)
      try {
        rawContent = await tryOpenRouter(prompt, requestId)
        console.log(`[Review:${requestId}] STEP 7 SUCCESS: OpenRouter responded`)
      } catch (orErr) {
        const orMsg = orErr instanceof Error ? orErr.message : String(orErr)
        console.error(`[Review:${requestId}] STEP 7 FAILED: OpenRouter error: ${orMsg}`)
        return NextResponse.json({
          success: false,
          stage: 'both_providers_failed',
          groq: groqMsg,
          openrouter: orMsg,
          error: 'Both AI providers failed',
        }, { status: 500 })
      }
    }

    console.log(`[Review:${requestId}] STEP 8: Extracting JSON from response (${rawContent.length} chars)`)
    let jsonStr: string
    try {
      jsonStr = extractJSON(rawContent)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to extract JSON'
      console.error(`[Review:${requestId}] STEP 8 FAILED: ${msg}`)
      return NextResponse.json({
        success: false,
        stage: 'extract_json',
        error: msg,
        preview: rawContent.slice(0, 1000),
      }, { status: 500 })
    }

    console.log(`[Review:${requestId}] STEP 8: Parsing JSON (${jsonStr.length} chars)`)
    let reviews: any[]
    try {
      reviews = JSON.parse(jsonStr)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'JSON parse error'
      console.error(`[Review:${requestId}] STEP 8 FAILED: JSON parse: ${msg}`)
      return NextResponse.json({
        success: false,
        stage: 'parse_json',
        error: msg,
        preview: jsonStr.slice(0, 1000),
      }, { status: 500 })
    }

    if (!Array.isArray(reviews)) {
      console.error(`[Review:${requestId}] STEP 8 FAILED: response is not an array`)
      return NextResponse.json({
        success: false,
        stage: 'validate_array',
        error: 'AI response is not an array',
        type: typeof reviews,
      }, { status: 500 })
    }
    console.log(`[Review:${requestId}] STEP 8 DONE: ${reviews.length} review items parsed`)

    console.log(`[Review:${requestId}] STEP 9: Normalizing ${reviews.length} items`)
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
    console.log(`[Review:${requestId}] STEP 9 DONE`)

    console.log(`[Review:${requestId}] STEP 10: Returning success`)
    return NextResponse.json({ success: true, data: normalized })
  } catch (err: any) {
    console.error(`[Review:${requestId}] UNCAUGHT ERROR:`, err)
    return NextResponse.json({
      success: false,
      stage: 'uncaught',
      error: err?.message || 'Review generation failed',
      stack: err?.stack,
    }, { status: 500 })
  }
}