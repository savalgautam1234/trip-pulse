import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import twilio from 'twilio'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { checkInId } = await req.json()

  const checkIn = await prisma.checkIn.findUnique({
    where: { id: checkInId },
    include: { trip: true },
  })

  if (!checkIn) return NextResponse.json({ error: 'Check-in not found' }, { status: 404 })
  if (checkIn.sentViaWA) return NextResponse.json({ error: 'Already sent' }, { status: 400 })

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: `whatsapp:${checkIn.trip.whatsappNumber}`,
    body: checkIn.message,
  })

  await prisma.checkIn.update({
    where: { id: checkInId },
    data: { sentViaWA: true, sentAt: new Date() },
  })

  return NextResponse.json({ success: true, sentAt: new Date() })
}
