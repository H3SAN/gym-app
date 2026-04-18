import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, ErrorCode } from '@/lib/api-error'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
    })

    if (!product || !product.isActive) {
      return apiError('Product not found', ErrorCode.NOT_FOUND, 404)
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('[PRODUCT GET ERROR]', error)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
