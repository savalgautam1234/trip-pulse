import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const EVENT_LABELS: Record<string, string> = {
  hotel_checkin: 'hotel check-in day',
  flight: 'flight day',
  activity: 'activity/tour day',
  free_day: 'free leisure day',
  checkout: 'last day and checkout',
}

const MOOD_LABELS: Record<string, string> = {
  happy: 'happy and satisfied',
  nervous: 'nervous (first-time traveller)',
  frustrated: 'frustrated due to a recent complaint',
  excited: 'very excited and highly engaged',
}

const LANG_INSTRUCTIONS: Record<string, string> = {
  EN: 'Write in warm, friendly English. Keep it under 80 words.',
  HI: 'Write entirely in Hindi (Devanagari script). Keep it under 80 words.',
  HINGLISH: 'Write in Hinglish (mix of Hindi and English, romanised Hindi). Very casual and friendly. Under 80 words.',
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tripId, moodSignal, todayEvent, issuesFlagged, language, tripData } = await req.json()

  // Use tripData passed from frontend, or fetch from DB
  let trip = tripData
  if (!trip) {
    try {
      const prisma = (await import('@/lib/prisma')).default
      trip = await prisma.trip.findUnique({ where: { id: tripId } })
    } catch (e) {
      console.error('DB error:', e)
    }
  }

  if (!trip) {
    trip = {
      coupleNames: 'Priya & Arjun Mehta',
      destination: 'Bali, Indonesia',
      hotel: 'The Layar Seminyak',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    }
  }

  const today = new Date()
  const dayNum = Math.max(1, Math.ceil((today.getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)))
  const totalDays = Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24))
  const firstNames = trip.coupleNames.split(' & ').map((n: string) => n.split(' ')[0])

  const prompt = `You are a Trip Manager at 30Sundays, a premium outbound travel company for Indian couples.

Trip details:
- Couple: ${trip.coupleNames}
- Destination: ${trip.destination}
- Hotel: ${trip.hotel}
- Trip day: Day ${dayNum} of ${totalDays}
- Today's event: ${EVENT_LABELS[todayEvent] ?? todayEvent}
- Customer mood: ${MOOD_LABELS[moodSignal] ?? moodSignal}
${issuesFlagged ? `- Issues: ${issuesFlagged}` : '- No active issues'}

Write a WhatsApp check-in message to send right now.
- Use their first names (${firstNames.join(' and ')})
- Be warm and personal, not corporate
- ${LANG_INSTRUCTIONS[language] ?? LANG_INSTRUCTIONS.EN}

After the message output:
<actions>
[{"priority":"HIGH","text":"action 1"},{"priority":"MEDIUM","text":"action 2"}]
</actions>`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const actionMatch = raw.match(/<actions>([\s\S]*?)<\/actions>/)
    const message = raw.replace(/<actions>[\s\S]*?<\/actions>/, '').trim()
    let actions: any[] = []
    if (actionMatch) { try { actions = JSON.parse(actionMatch[1].trim()) } catch {} }

    // Try to save to DB
    try {
      const prisma = (await import('@/lib/prisma')).default
      const userId = (session.user as any).id
      if (userId && !userId.includes('@')) {
        await prisma.checkIn.create({
          data: {
            tripId, authorId: userId, message,
            language: (language || 'EN') as any,
            moodSignal, todayEvent,
            issuesFlagged: issuesFlagged ?? null,
            actions: { create: actions.map((a: any) => ({ priority: a.priority, text: a.text })) },
          },
        })
      }
    } catch (e) { console.error('DB save (non-fatal):', e) }

    return NextResponse.json({ message, actions, checkIn: { id: Date.now().toString(), message, actions, sentViaWA: false, createdAt: new Date() } })
  } catch (e: any) {
    console.error('Checkin API error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
