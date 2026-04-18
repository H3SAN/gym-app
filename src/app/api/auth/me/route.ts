import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { apiError, ErrorCode } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request)

  if (error || !user) {
    return apiError(error || 'Unauthorized', ErrorCode.AUTH_REQUIRED, 401)
  }

  const { passwordHash: _, faceEmbedding, ...safeUser } = user

  return Response.json({
    user: {
      ...safeUser,
      membership: safeUser.memberships[0] || null,
      faceEnrolled: faceEmbedding.length > 0,
    },
  })
}
