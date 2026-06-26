import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(_: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [totalTrips, statusCounts, tmStats, recentCheckIns, actionStats] = await Promise.all([
    prisma.trip.count(),
    prisma.trip.groupBy({ by: ['status'], _count: true }),
    prisma.trip.groupBy({
      by: ['tripManagerId'],
      _count: true,
      orderBy: { _count: { tripManagerId: 'desc' } },
    }),
    prisma.checkIn.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        trip: { select: { destination: true, coupleNames: true } },
        author: { select: { name: true, email: true } },
      },
    }),
    prisma.action.groupBy({ by: ['priority'], _count: true }),
  ])

  const tmIds = tmStats.map(t => t.tripManagerId)
  const tms = await prisma.user.findMany({
    where: { id: { in: tmIds } },
    select: { id: true, name: true, email: true },
  })

  const tmMap = Object.fromEntries(tms.map(t => [t.id, t]))

  return NextResponse.json({
    totalTrips,
    statusCounts: Object.fromEntries(statusCounts.map(s => [s.status, s._count])),
    tmStats: tmStats.map(t => ({ ...tmMap[t.tripManagerId], tripCount: t._count })),
    recentCheckIns,
    actionStats: Object.fromEntries(actionStats.map(a => [a.priority, a._count])),
  })
}
