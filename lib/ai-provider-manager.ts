import { Redis } from '@upstash/redis'
import { generateQuiz as groqGenerate } from '@/lib/groq'
import { generateQuizViaOpenRouter } from '@/lib/openrouter'
import { QuizQuestion } from '@/types'

// ─── Types ──────────────────────────────────────────────────

interface GroqState {
  status: 'available' | 'disabled_for_today'
  disabledAt: number | null
  failureReason: string | null
}

interface LogEntry {
  timestamp: string
  provider: string
  event: string
  detail?: string
}

// ─── Constants ──────────────────────────────────────────────

const GROQ_STATE_KEY = 'provider:groq:state'
const LOG_KEY_PREFIX = 'provider:log:'
const LOG_RETENTION_DAYS = 7

// ─── State ──────────────────────────────────────────────────

let groqState: GroqState = {
  status: 'available',
  disabledAt: null,
  failureReason: null,
}

// ─── Redis (lazy, matches rate-limit.ts pattern) ────────────

let redis: Redis | null = null
let redisAvailable = false

function getRedis(): Redis | null {
  if (redis) return redis
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
      redisAvailable = true
    } catch {
      console.warn('[AIProvider] Redis unavailable — using in-memory state only')
    }
  }
  return redis
}

// ─── State Persistence ──────────────────────────────────────

async function loadState(): Promise<void> {
  const client = getRedis()
  if (client && redisAvailable) {
    try {
      const raw = await client.get<unknown>(GROQ_STATE_KEY)
      if (raw && typeof raw === 'string') {
        groqState = JSON.parse(raw) as GroqState
        return
      }
    } catch {
      // fall through to in-memory
    }
  }
}

async function saveState(): Promise<void> {
  const client = getRedis()
  const data = JSON.stringify(groqState)

  if (client && redisAvailable) {
    try {
      await client.set(GROQ_STATE_KEY, data)
      const ttl = Math.ceil((getNextDayStart() - Date.now()) / 1000)
      if (ttl > 0) {
        await client.expire(GROQ_STATE_KEY, ttl)
      }
    } catch {
      // in-memory state is already assigned
    }
  }
}

// ─── Helpers ────────────────────────────────────────────────

function getNextDayStart(): number {
  const now = new Date()
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return tomorrow.getTime()
}

function isExhaustiveError(err: unknown): boolean {
  if (err && typeof err === 'object') {
    const status = (err as Record<string, unknown>).status
    if (status === 429 || status === 402 || status === 403) return true
  }

  const msg =
    err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase()

  return (
    msg.includes('rate limit') ||
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('insufficient credits') ||
    msg.includes('daily token limit') ||
    msg.includes('daily limit') ||
    msg.includes('exhausted') ||
    msg.includes('insufficient_quota') ||
    msg.includes('rate_limit_exceeded') ||
    msg.includes('credits exceeded')
  )
}

// ─── Logging ────────────────────────────────────────────────

function log(event: string, provider: string, detail?: string) {
  const timestamp = new Date().toISOString()
  const entry: LogEntry = { timestamp, provider, event, detail }

  console.log(`[${timestamp}] [AIProvider] [${provider}] ${event}${detail ? ` — ${detail}` : ''}`)

  const client = getRedis()
  if (client && redisAvailable) {
    const logKey = `${LOG_KEY_PREFIX}${new Date().toISOString().slice(0, 10)}`
    client.lpush(logKey, JSON.stringify(entry)).catch(() => {})
    client.expire(logKey, 86400 * LOG_RETENTION_DAYS).catch(() => {})
  }
}

// ─── Provider Functions ─────────────────────────────────────

async function callGroq(text: string): Promise<QuizQuestion[]> {
  log('attempt', 'groq')

  try {
    const result = await groqGenerate(text)
    log('success', 'groq', `${result.length} questions generated`)
    return result
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log('failure', 'groq', message)

    if (isExhaustiveError(err)) {
      log('exhausted', 'groq', 'Disabling Groq until next day')
      await disableGroqTemporarily(message)
    }

    throw err
  }
}

async function callOpenRouter(text: string): Promise<QuizQuestion[]> {
  log('attempt', 'openrouter')

  try {
    const result = await generateQuizViaOpenRouter(text)
    log('success', 'openrouter', `${result.length} questions generated`)
    return result
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log('failure', 'openrouter', message)
    throw new Error('Unable to generate quiz. Please try again.')
  }
}

// ─── Public API ─────────────────────────────────────────────

export async function generateResponse(text: string): Promise<QuizQuestion[]> {
  await loadState()

  const groqHealthy = await checkGroqHealth()

  if (groqHealthy) {
    try {
      return await callGroq(text)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      log('fallback', 'system', `Groq failed (${message}) — switching to OpenRouter`)
      return await callOpenRouter(text)
    }
  }

  log('unavailable', 'groq', `Status: ${groqState.status}`)
  return await callOpenRouter(text)
}

export async function checkGroqHealth(): Promise<boolean> {
  await loadState()

  if (groqState.status === 'disabled_for_today') {
    const now = Date.now()
    if (now >= getNextDayStart()) {
      log('recovered', 'groq', 'Cooldown expired — re-enabling Groq')
      await resetGroq()
      return true
    }
    log('cooldown', 'groq', `Resets at ${new Date(getNextDayStart()).toISOString()}`)
    return false
  }

  return true
}

export async function disableGroqTemporarily(reason: string): Promise<void> {
  groqState = {
    status: 'disabled_for_today',
    disabledAt: Date.now(),
    failureReason: reason,
  }
  await saveState()
  const resetTime = new Date(getNextDayStart()).toISOString()
  log('disabled', 'groq', `Until ${resetTime}. Reason: ${reason}`)
}

async function resetGroq(): Promise<void> {
  groqState = { status: 'available', disabledAt: null, failureReason: null }
  await saveState()
}

export async function getGroqStatus(): Promise<{
  status: string
  remainingCooldown: number | null
}> {
  await loadState()
  if (groqState.status === 'disabled_for_today' && groqState.disabledAt) {
    const remaining = Math.max(0, getNextDayStart() - Date.now())
    return { status: groqState.status, remainingCooldown: remaining }
  }
  return { status: groqState.status, remainingCooldown: null }
}
