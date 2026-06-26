import { format } from 'date-fns'
import { TripStatus } from '@/types'

export function formatDate(dateStr: string) {
  return format(new Date(dateStr), 'MMM d')
}

export function dayOfTrip(startDate: string) {
  const start = new Date(startDate)
  const today = new Date()
  const diff = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(1, diff)
}

export function statusLabel(status: TripStatus) {
  return { ON_TRACK: 'On track', NEEDS_ATTENTION: 'Needs attention', ISSUE_FLAGGED: 'Issue flagged' }[status]
}

export function statusColor(status: TripStatus) {
  return { ON_TRACK: 'var(--teal)', NEEDS_ATTENTION: 'var(--amber)', ISSUE_FLAGGED: 'var(--red)' }[status]
}

export function priorityColor(p: string) {
  return { HIGH: 'var(--red)', MEDIUM: 'var(--amber)', LOW: 'var(--teal)' }[p] ?? 'var(--text2)'
}
