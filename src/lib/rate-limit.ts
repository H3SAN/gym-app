import { NextRequest } from 'next/server'
import { apiError, ErrorCode } from './api-error'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000)

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count }
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

// Presets
export const rateLimits = {
  /** 5 requests per 15 minutes — signup, forgot-password */
  strict: (request: NextRequest, suffix = '') => {
    const ip = getClientIp(request)
    return checkRateLimit(`strict:${ip}:${suffix}`, 5, 15 * 60 * 1000)
  },
  /** 10 requests per minute — login */
  login: (request: NextRequest) => {
    const ip = getClientIp(request)
    return checkRateLimit(`login:${ip}`, 10, 60 * 1000)
  },
  /** 30 requests per minute per user — QR generation */
  qr: (userId: string) => {
    return checkRateLimit(`qr:${userId}`, 30, 60 * 1000)
  },
  /** 5 attempts per 15 minutes per IP — referral code application (prevents brute-force) */
  referral: (request: NextRequest) => {
    const ip = getClientIp(request)
    return checkRateLimit(`referral:${ip}`, 5, 15 * 60 * 1000)
  },
}

export function rateLimitError() {
  return apiError('Too many requests. Please try again later.', ErrorCode.RATE_LIMITED, 429)
}
