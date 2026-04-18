import { NextRequest } from 'next/server'
import { verifyToken } from './jwt'
import prisma from './prisma'

export async function getCurrentUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    let token: string | null = null

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }

    if (!token) {
      const cookieToken = request.cookies.get('token')?.value
      token = cookieToken || null
    }

    if (!token) return null

    const payload = await verifyToken(token)
    const userId = payload.userId as string

    if (!userId) return null

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          where: { isActive: true, endDate: { gte: new Date() } },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
    })

    return user
  } catch {
    return null
  }
}

export async function requireAuth(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return { user: null, error: 'Unauthorized' }
  }
  return { user, error: null }
}

export async function requireAdmin(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return { user: null, error: 'Unauthorized' }
  }
  if (user.role !== 'ADMIN') {
    return { user: null, error: 'Forbidden' }
  }
  return { user, error: null }
}
