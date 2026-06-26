export type TripStatus = 'ON_TRACK' | 'NEEDS_ATTENTION' | 'ISSUE_FLAGGED'
export type Language = 'EN' | 'HI' | 'HINGLISH'
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW'
export type UserRole = 'TRIP_MANAGER' | 'ADMIN'

export interface TripWithRelations {
  id: string
  coupleNames: string
  destination: string
  hotel: string
  departureCity: string
  flightDetails: string | null
  visaStatus: string
  startDate: string
  endDate: string
  whatsappNumber: string
  status: TripStatus
  notes: string | null
  tripManagerId: string
  tripManager: { id: string; name: string | null; email: string }
  checkIns: CheckInWithActions[]
  createdAt: string
  updatedAt: string
}

export interface CheckInWithActions {
  id: string
  tripId: string
  message: string
  language: Language
  moodSignal: string
  todayEvent: string
  issuesFlagged: string | null
  sentViaWA: boolean
  sentAt: string | null
  actions: ActionItem[]
  createdAt: string
  author: { name: string | null; email: string }
}

export interface ActionItem {
  id: string
  priority: Priority
  text: string
  completed: boolean
}

export interface GenerateCheckinRequest {
  tripId: string
  moodSignal: string
  todayEvent: string
  issuesFlagged?: string
  language: Language
}

export interface GenerateCheckinResponse {
  message: string
  actions: { priority: Priority; text: string }[]
}
