import { Resend } from 'resend'

export function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY environment variable is not set')
  return new Resend(key)
}

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? 'Avengers Gym <noreply@avengers-gym.com>'
