import { SignJWT, jwtVerify } from 'jose'

function getSecret() {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) throw new Error('JWT_SECRET environment variable is not set')
  return new TextEncoder().encode(jwtSecret)
}

export async function signToken(payload: Record<string, unknown>, expiresIn = '7d') {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret())
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret())
  return payload
}
