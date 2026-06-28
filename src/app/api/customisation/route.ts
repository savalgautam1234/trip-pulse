import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { coupleNames, destination, startDate, endDate, tripType, interests, concerns, currentItinerary, specialOccasion, dietaryReqs } = await req.json()

  const nights = startDate && endDate
    ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)
    : 7

  const firstNames = coupleNames.split(' & ').map((n: string) => n.split(' ')[0])

  const prompt = `You are a senior Customisation Manager at 30Sundays, a premium outbound travel company for Indian couples. You handle the customer relationship from booking to D-7.

Generate a complete customisation pack for:
- Couple: ${coupleNames} (${firstNames[0]} and ${firstNames[1] || firstNames[0]})
- Destination: ${destination}
- Dates: ${startDate} to ${endDate || 'TBD'} (${nights} nights)
- Trip type: ${tripType || 'leisure'}
- Interests: ${interests?.join(', ') || 'general'}
- Concerns: ${concerns?.join(', ') || 'none'}
- Current itinerary: ${currentItinerary || 'standard package'}
- Special occasion: ${specialOccasion || 'none'}
- Dietary requirements: ${dietaryReqs || 'none'}

Return ONLY valid JSON, no other text:
{
  "firstCallScript": {
    "greeting": "personalized opening greeting for the call addressing them by first name",
    "itineraryWalkthrough": ["Day 1 walkthrough line", "Day 2 walkthrough line", "..."],
    "keyHighlights": ["highlight 1", "highlight 2", "highlight 3", "highlight 4"],
    "thingsToDiscuss": ["question/topic 1", "question/topic 2", "question/topic 3"],
    "closing": "warm personalized closing for the call"
  },
  "itinerarySuggestions": [
    {
      "day": 1,
      "title": "day theme",
      "morning": "morning activity",
      "afternoon": "afternoon activity",
      "evening": "evening activity",
      "tip": "local tip for this day"
    }
  ],
  "visaChecklist": [
    {
      "item": "document name",
      "status": "required",
      "details": "specific details about this document"
    }
  ],
  "changeRecommendations": [
    {
      "current": "what's currently in the itinerary",
      "suggested": "what to change it to",
      "reason": "why this is better for this couple",
      "priority": "high"
    }
  ],
  "packingList": ["item 1", "item 2", "..."],
  "coupleNotes": "one-line personal note about this couple to remember"
}

Make the first call script sound natural and warm, using ${firstNames[0]} and ${firstNames[1] || firstNames[0]} by name. Include ${Math.min(nights, 7)} days in itinerary. Include 5-7 visa checklist items, 3-4 change recommendations, 20 packing items.`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
    const data = JSON.parse(cleaned)
    return NextResponse.json(data)
  } catch (e: any) {
    console.error('Customisation API error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
