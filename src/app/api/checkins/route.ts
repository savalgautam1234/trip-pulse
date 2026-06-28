import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const userId = (session.user as any).id
    const role = (session.user as any).role
    const checkIns = await prisma.checkIn.findMany({
      where: role === 'ADMIN' ? {} : { trip: { tripManagerId: userId } },
      include: {
        trip: { select: { id: true, destination: true, coupleNames: true, hotel: true, status: true } },
        author: { select: { name: true, email: true } },
        actions: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    return NextResponse.json(checkIns)
  } catch (e) {
    return NextResponse.json([])
  }
}
