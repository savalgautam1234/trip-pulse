import { format } from 'date-fns'
import { TripStatus } from '@/types'

export function formatDate(dateStr: string) {
  return format(new Date(dateStr), 'MMM d')
}

export function tripDayStatus(startDate: string, endDate: string): { label: string; day: number; total: number } {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const today = new Date()
  const total = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000))

  if (today < start) {
    const daysUntil = Math.ceil((start.getTime() - today.getTime()) / 86400000)
    return { day: 0, total, label: `Starts in ${daysUntil}d` }
  }
  if (today > end) {
    return { day: total, total, label: 'Completed' }
  }
  const day = Math.max(1, Math.ceil((today.getTime() - start.getTime()) / 86400000))
  return { day, total, label: `Day ${day} of ${total}` }
}

// Keep for backward compat
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
