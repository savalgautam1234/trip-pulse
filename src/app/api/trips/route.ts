import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const role = (session.user as any).role

  const trips = await prisma.trip.findMany({
    where: role === 'ADMIN' ? {} : { tripManagerId: userId },
    include: {
      tripManager: { select: { id: true, name: true, email: true } },
      checkIns: {
        include: {
          actions: true,
          author: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
    orderBy: { startDate: 'asc' },
  })

  return NextResponse.json(trips)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const userId = (session.user as any).id

  const trip = await prisma.trip.create({
    data: {
      coupleNames: body.coupleNames,
      destination: body.destination,
      hotel: body.hotel,
      departureCity: body.departureCity,
      flightDetails: body.flightDetails ?? null,
      visaStatus: body.visaStatus,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      whatsappNumber: body.whatsappNumber,
      notes: body.notes ?? null,
      tripManagerId: userId,
    },
    include: {
      tripManager: { select: { id: true, name: true, email: true } },
      checkIns: { include: { actions: true, author: { select: { name: true, email: true } } } },
    },
  })

  return NextResponse.json(trip)
}
