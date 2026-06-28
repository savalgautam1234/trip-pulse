'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { TripWithRelations, Language } from '@/types'
import { formatDate, statusLabel, priorityColor, tripDayStatus } from '@/lib/utils'
import styles from './page.module.css'

const MOODS = [
  { value: 'happy', label: 'Happy — no issues' },
  { value: 'nervous', label: 'Nervous / first-time' },
  { value: 'frustrated', label: 'Frustrated' },
  { value: 'excited', label: 'Very excited' },
]
const EVENTS = [
  { value: 'hotel_checkin', label: 'Hotel check-in' },
  { value: 'flight', label: 'Flight day' },
  { value: 'activity', label: 'Activity / tour day' },
  { value: 'free_day', label: 'Free day' },
  { value: 'checkout', label: 'Last day / checkout' },
]
const LANGS: { value: Language; label: string }[] = [
  { value: 'EN', label: 'English' },
  { value: 'HI', label: 'Hindi' },
  { value: 'HINGLISH', label: 'Hinglish' },
]

export default function TripDetailPage() {
  const { id } = useParams()
  const [trip, setTrip] = useState<TripWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [mood, setMood] = useState('happy')
  const [event, setEvent] = useState('hotel_checkin')
  const [issues, setIssues] = useState('')
  const [language, setLanguage] = useState<Language>('EN')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<{ message: string; actions: any[] } | null>(null)
  const [sending, setSending] = useState(false)
  const [sentId, setSentId] = useState<string | null>(null)
  const [lastCheckInId, setLastCheckInId] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/trips/${id}`).then(r => r.json()).then(d => { setTrip(d); setLoading(false) })
  }, [id])

  async function generate() {
    if (!trip) return
    setGenerating(true)
    setResult(null)
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        tripId: trip.id, 
        moodSignal: mood, 
        todayEvent: event, 
        issuesFlagged: issues || undefined, 
        language,
        tripData: {
          coupleNames: trip.coupleNames,
          destination: trip.destination,
          hotel: trip.hotel,
          startDate: trip.startDate,
          endDate: trip.endDate,
        }
      }),
    })
    const data = await res.json()
    setResult({ message: data.message, actions: data.actions })
    setLastCheckInId(data.checkIn?.id ?? null)
    setTrip(prev => prev ? { ...prev, checkIns: [data.checkIn, ...prev.checkIns] } : prev)
    setGenerating(false)
  }

  async function sendWhatsApp() {
    if (!lastCheckInId) return
    setSending(true)
    await fetch('/api/whatsapp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ checkInId: lastCheckInId }) })
    setSentId(lastCheckInId)
    setSending(false)
  }

  if (loading) return <div className={styles.loading}>Loading trip...</div>
  if (!trip) return <div className={styles.loading}>Trip not found</div>

  const { label: dayLabel, day: dayNum, total: totalDays } = tripDayStatus(trip.startDate, trip.endDate)
  

  return (
    <div className={styles.root}>
      <div className={styles.topRow}>
        <div>
          <h1 className={styles.title}>{trip.destination}</h1>
          <div className={styles.sub}>{trip.coupleNames} · {dayLabel}</div>
        </div>
        <span className={`${styles.badge} ${styles[trip.status.toLowerCase().replace('_','')]}`}>{statusLabel(trip.status)}</span>
      </div>

      <div className={styles.grid}>
        {/* Left — info + generator */}
        <div className={styles.left}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Trip details</div>
            <div className={styles.infoGrid}>
              {[
                ['Hotel', trip.hotel],
                ['Departure', trip.departureCity],
                ['Visa', trip.visaStatus],
                ['Flight', trip.flightDetails ?? '—'],
                ['Dates', `${formatDate(trip.startDate)} → ${formatDate(trip.endDate)}`],
                ['WhatsApp', trip.whatsappNumber],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className={styles.infoLabel}>{k}</div>
                  <div className={styles.infoVal}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.aiCard}>
            <div className={styles.aiHeader}>✦ AI check-in generator</div>
            <div className={styles.aiBody}>
              <div className={styles.formRow}>
                <label>Mood signal</label>
                <select value={mood} onChange={e => setMood(e.target.value)}>
                  {MOODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div className={styles.formRow}>
                <label>Today's event</label>
                <select value={event} onChange={e => setEvent(e.target.value)}>
                  {EVENTS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>
              <div className={styles.formRow}>
                <label>Issues to flag (optional)</label>
                <textarea value={issues} onChange={e => setIssues(e.target.value)} placeholder="e.g. hotel room not ready..." rows={3} />
              </div>
              <div className={styles.langRow}>
                {LANGS.map(l => (
                  <button key={l.value} className={`${styles.langBtn} ${language === l.value ? styles.langActive : ''}`} onClick={() => setLanguage(l.value)}>
                    {l.label}
                  </button>
                ))}
              </div>
              <button className={styles.genBtn} onClick={generate} disabled={generating}>
                {generating ? '✦ Generating...' : '✦ Generate check-in'}
              </button>
            </div>
          </div>

          {result && (
            <div className={styles.resultCard}>
              <div className={styles.cardTitle}>Generated check-in</div>
              <div className={styles.message}>{result.message}</div>
              <div className={styles.resultActions}>
                <button className={styles.copyBtn} onClick={() => navigator.clipboard.writeText(result.message)}>
                  ⎘ Copy
                </button>
                <button className={styles.waBtn} onClick={sendWhatsApp} disabled={sending || sentId === lastCheckInId}>
                  {sentId === lastCheckInId ? '✓ Sent via WhatsApp' : sending ? 'Sending...' : '↗ Send via WhatsApp'}
                </button>
              </div>
              {result.actions.length > 0 && (
                <div className={styles.actionsBox}>
                  <div className={styles.actionsTitle}>Actions for today</div>
                  {result.actions.map((a: any, i: number) => (
                    <div key={i} className={styles.actionRow}>
                      <span className={styles.priority} style={{ color: priorityColor(a.priority) }}>{a.priority}</span>
                      <span>{a.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right — check-in history */}
        <div className={styles.right}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Check-in history ({trip.checkIns.length})</div>
            {trip.checkIns.length === 0 ? (
              <div className={styles.emptyHistory}>No check-ins yet</div>
            ) : (
              <div className={styles.history}>
                {trip.checkIns.map(ci => (
                  <div key={ci.id} className={styles.historyItem}>
                    <div className={styles.historyMeta}>
                      <span>{new Date(ci.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      <span className={styles.waTag}>{ci.sentViaWA ? '✓ WhatsApp sent' : 'Draft'}</span>
                    </div>
                    <div className={styles.historyMsg}>{ci.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
