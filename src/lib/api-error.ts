import { NextResponse } from 'next/server'

export const ErrorCode = {
  // Auth
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',
  AUTH_EMAIL_EXISTS: 'AUTH_EMAIL_EXISTS',
  // Validation
  VALIDATION_REQUIRED: 'VALIDATION_REQUIRED',
  VALIDATION_INVALID: 'VALIDATION_INVALID',
  // Resources
  NOT_FOUND: 'NOT_FOUND',
  // Business logic
  BOOKING_CONFLICT: 'BOOKING_CONFLICT',
  BOOKING_CAPACITY_FULL: 'BOOKING_CAPACITY_FULL',
  MEMBERSHIP_REQUIRED: 'MEMBERSHIP_REQUIRED',
  MEMBERSHIP_EXPIRED: 'MEMBERSHIP_EXPIRED',
  QR_INVALID: 'QR_INVALID',
  QR_USED: 'QR_USED',
  QR_EXPIRED: 'QR_EXPIRED',
  // Rate limiting
  RATE_LIMITED: 'RATE_LIMITED',
  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

export function apiError(message: string, code: ErrorCode, status: number) {
  return NextResponse.json({ error: message, code, status }, { status })
}
