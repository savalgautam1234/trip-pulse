import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'
import prisma from '@/lib/prisma'
import { Language, Priority } from '@/types'

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

const LANG_INSTRUCTIONS: Record<Language, string> = {
  EN: 'Write in warm, friendly English. Keep it under 80 words.',
  HI: 'Write entirely in Hindi (Devanagari script). Keep it under 80 words.',
  HINGLISH: 'Write in Hinglish (mix of Hindi and English, romanised Hindi). Very casual and friendly. Under 80 words.',
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tripId, moodSignal, todayEvent, issuesFlagged, language } = await req.json()

  const trip = await prisma.trip.findUnique({ where: { id: tripId } })
  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

  const today = new Date()
  const dayNum = Math.ceil((today.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24))
  const totalDays = Math.ceil((trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24))
  const firstNames = trip.coupleNames.split(' & ').map(n => n.split(' ')[0])

  const prompt = `You are a Trip Manager at 30Sundays, a premium outbound travel company for Indian couples. You are the couple's single point of contact throughout their trip.

Trip details:
- Couple: ${trip.coupleNames}
- Destination: ${trip.destination}
- Hotel: ${trip.hotel}
- Trip day: Day ${dayNum} of ${totalDays}
- Today's event: ${EVENT_LABELS[todayEvent] ?? todayEvent}
- Customer mood: ${MOOD_LABELS[moodSignal] ?? moodSignal}
${issuesFlagged ? `- Issues to address: ${issuesFlagged}` : '- No active issues'}

Write a WhatsApp check-in message to send right now.

Rules:
- Use their first names (${firstNames.join(' and ')})
- Be warm and personal, not corporate
- If there's an issue, acknowledge and share what's being done
- If last day or milestone, make it special
- ${LANG_INSTRUCTIONS[language as Language] ?? LANG_INSTRUCTIONS.EN}

After the message, output a JSON block in this exact format:
<actions>
[
  {"priority":"HIGH","text":"action item"},
  {"priority":"MEDIUM","text":"action item"}
]
</actions>

Include 2-4 action items for today.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  const actionMatch = raw.match(/<actions>([\s\S]*?)<\/actions>/)
  const message = raw.replace(/<actions>[\s\S]*?<\/actions>/, '').trim()

  let actions: { priority: Priority; text: string }[] = []
  if (actionMatch) {
    try { actions = JSON.parse(actionMatch[1].trim()) } catch {}
  }

  // Persist to DB
  const userId = (session.user as any).id
  const checkIn = await prisma.checkIn.create({
    data: {
      tripId,
      authorId: userId,
      message,
      language: language as Language,
      moodSignal,
      todayEvent,
      issuesFlagged: issuesFlagged ?? null,
      actions: {
        create: actions.map(a => ({ priority: a.priority, text: a.text })),
      },
    },
    include: { actions: true, author: { select: { name: true, email: true } } },
  })

  return NextResponse.json({ checkIn, message, actions })
}
