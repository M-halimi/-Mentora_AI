import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

/* ─── Configuration ─────────────────────────────────────────── */

const LIMIT = 3
const DEV_ME_IP = '105.69.252.5'

function getDevInternalKey(): string {
  return process.env.DEV_INTERNAL_KEY || 'teacher-copilot-dev'
}

/* ─── IP extraction ─────────────────────────────────────────── */

export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()

  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp

  const cfIp = req.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp

  return '127.0.0.1'
}

/* ─── Dev bypass ────────────────────────────────────────────── */

export function isDevRequest(req: NextRequest): boolean {
  if (getClientIP(req) === DEV_ME_IP) return true
  if (req.headers.get('x-dev-mode') === 'true') return true
  if (req.headers.get('x-internal-key') === getDevInternalKey()) return true
  return false
}

/* ─── Redis client (with in-memory fallback) ────────────────── */

function getRedisTTL(): number {
  const now = new Date()
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
  return Math.ceil((tomorrow.getTime() - now.getTime()) / 1000)
}

function getRedisKey(identifier: string): string {
  const date = new Date().toISOString().slice(0, 10)
  return `ratelimit:${identifier}:${date}`
}

// ── In-memory fallback ──
interface MemEntry {
  count: number
  expiresAt: number
}
const memStore = new Map<string, MemEntry>()

function getMemKey(ip: string, visitorId: string): string {
  return `${ip}:${visitorId}:${new Date().toISOString().slice(0, 10)}`
}

// ── Lazy Redis client ──
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
    } catch (e) {
      console.warn('[RateLimit] Failed to init Redis, using in-memory fallback:', e)
    }
  }
  return redis
}

/* ─── Rate limit helpers ────────────────────────────────────── */

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: string
}

async function checkRedis(ip: string, visitorId: string): Promise<RateLimitResult> {
  const client = getRedis()
  if (!client) return checkMemory(ip, visitorId)

  const key = getRedisKey(`${ip}:${visitorId}`)
  const current = (await client.get<number>(key)) ?? 0

  if (current >= LIMIT) {
    const ttl = await client.ttl(key)
    const resetAt = ttl > 0
      ? new Date(Date.now() + ttl * 1000).toISOString()
      : new Date(Date.now() + getRedisTTL() * 1000).toISOString()
    return { allowed: false, remaining: 0, resetAt }
  }

  return { allowed: true, remaining: LIMIT - current, resetAt: '' }
}

async function incrementRedis(ip: string, visitorId: string): Promise<void> {
  const client = getRedis()
  if (!client) return incrementMemory(ip, visitorId)

  const key = getRedisKey(`${ip}:${visitorId}`)
  const count = await client.incr(key)
  if (count === 1) {
    await client.expire(key, getRedisTTL())
  }
}

function checkMemory(ip: string, visitorId: string): RateLimitResult {
  const key = getMemKey(ip, visitorId)
  const entry = memStore.get(key)
  const now = Date.now()

  if (entry) {
    if (entry.expiresAt <= now) {
      memStore.delete(key)
      return { allowed: true, remaining: LIMIT, resetAt: '' }
    }
    if (entry.count >= LIMIT) {
      return { allowed: false, remaining: 0, resetAt: new Date(entry.expiresAt).toISOString() }
    }
    return { allowed: true, remaining: LIMIT - entry.count, resetAt: '' }
  }

  return { allowed: true, remaining: LIMIT, resetAt: '' }
}

function incrementMemory(ip: string, visitorId: string): void {
  const key = getMemKey(ip, visitorId)
  const now = Date.now()
  const entry = memStore.get(key)

  if (entry) {
    if (entry.expiresAt <= now) {
      memStore.delete(key)
    } else {
      entry.count++
      return
    }
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  memStore.set(key, { count: 1, expiresAt: tomorrow.getTime() })
}

/* ─── Public API ────────────────────────────────────────────── */

export function getVisitorId(req: NextRequest): string {
  return req.headers.get('x-visitor-id') || ''
}

export async function checkRateLimit(
  ip: string,
  visitorId: string
): Promise<RateLimitResult> {
  if (getRedis()) return checkRedis(ip, visitorId)
  return checkMemory(ip, visitorId)
}

export async function incrementCounter(
  ip: string,
  visitorId: string
): Promise<void> {
  if (getRedis()) return incrementRedis(ip, visitorId)
  return incrementMemory(ip, visitorId)
}

/* ─── API Route Wrapper ─────────────────────────────────────── */

type RouteHandler = (req: NextRequest) => Promise<NextResponse>

export function withRateLimit(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest): Promise<NextResponse> => {
    if (isDevRequest(req)) {
      return handler(req)
    }

    const ip = getClientIP(req)
    const visitorId = getVisitorId(req)

    const result = await checkRateLimit(ip, visitorId)

    if (!result.allowed) {
      console.warn(`[RateLimit] Blocked ${ip}:${visitorId} — resets ${result.resetAt}`)
      return NextResponse.json(
        {
          error: 'rate_limit_exceeded',
          message: 'Daily limit reached (3 PDFs/day). Try again tomorrow.',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetAt,
          },
        }
      )
    }

    const response = await handler(req)

    if (response.status >= 200 && response.status < 300) {
      await incrementCounter(ip, visitorId)
    }

    return response
  }
}
