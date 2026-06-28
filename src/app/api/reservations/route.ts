import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { destination, departureCity, startDate, endDate, budget, vibe, adults, notes } = await req.json()

  const nights = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)

  const prompt = `You are a senior travel reservations specialist at 30Sundays, a premium outbound travel company for Indian couples.

Generate a complete, realistic reservation package for:
- Destination: ${destination}
- Departure: ${departureCity}, India
- Dates: ${startDate} to ${endDate} (${nights} nights)
- Budget: ${budget} per couple
- Adults: ${adults}
- Vibe: ${vibe || 'balanced experience'}
- Notes: ${notes || 'none'}

Return ONLY valid JSON in this exact format, no other text:
{
  "flights": [
    {
      "airline": "airline name",
      "departure": "city code + time e.g. BOM 06:40",
      "arrival": "city code + time e.g. DPS 14:30",
      "price": "₹XX,XXX per person",
      "duration": "Xh Xm",
      "stops": "Non-stop or X stop"
    }
  ],
  "hotels": [
    {
      "name": "hotel name",
      "stars": 4,
      "location": "area/neighborhood",
      "pricePerNight": "₹XX,XXX",
      "highlights": ["pool", "breakfast included", "beach access"],
      "rating": "4.5/5"
    }
  ],
  "activities": [
    {
      "name": "activity name",
      "duration": "X hours",
      "price": "₹X,XXX per couple",
      "description": "brief description",
      "bestFor": "couples / adventurers / etc"
    }
  ],
  "visaInfo": {
    "required": true,
    "type": "visa type",
    "processingTime": "X working days",
    "cost": "₹X,XXX per person or Free",
    "documents": ["passport", "photos", "bank statement"]
  },
  "totalEstimate": "₹X,XX,XXX",
  "travelTips": ["tip 1", "tip 2", "tip 3"]
}

Include 3 flight options, 3 hotel options, 5 activities. Make it realistic for Indian travellers from ${departureCity}.`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
    const data = JSON.parse(cleaned)
    return NextResponse.json(data)
  } catch (e: any) {
    console.error('Reservations API error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
