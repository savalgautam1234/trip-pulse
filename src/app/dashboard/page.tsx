'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TripWithRelations } from '@/types'
import { formatDate, dayOfTrip, statusColor, statusLabel } from '@/lib/utils'
import styles from './page.module.css'

export default function DashboardPage() {
  const [trips, setTrips] = useState<TripWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    fetch('/api/trips').then(r => r.json()).then(d => { setTrips(d); setLoading(false) })
  }, [])

  const onTrack = trips.filter(t => t.status === 'ON_TRACK').length
  const needsAttention = trips.filter(t => t.status === 'NEEDS_ATTENTION').length
  const issuesFlagged = trips.filter(t => t.status === 'ISSUE_FLAGGED').length

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Trips</h1>
          <p className={styles.sub}>Your active portfolio</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAdd(true)}>+ Add trip</button>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}><div className={styles.statNum}>{trips.length}</div><div className={styles.statLabel}>Total trips</div></div>
        <div className={styles.stat}><div className={styles.statNum} style={{color:'var(--teal)'}}>{onTrack}</div><div className={styles.statLabel}>On track</div></div>
        <div className={styles.stat}><div className={styles.statNum} style={{color:'var(--amber)'}}>{needsAttention}</div><div className={styles.statLabel}>Needs attention</div></div>
        <div className={styles.stat}><div className={styles.statNum} style={{color:'var(--red)'}}>{issuesFlagged}</div><div className={styles.statLabel}>Issue flagged</div></div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading trips...</div>
      ) : trips.length === 0 ? (
        <div className={styles.empty}>No trips yet. Add your first trip to get started.</div>
      ) : (
        <div className={styles.tripGrid}>
          {trips.map(trip => (
            <Link key={trip.id} href={`/dashboard/trips/${trip.id}`} className={styles.tripCard}>
              <div className={styles.tripTop}>
                <div>
                  <div className={styles.tripDest}>{trip.destination}</div>
                  <div className={styles.tripCouple}>{trip.coupleNames}</div>
                </div>
                <span className={`${styles.statusBadge} ${styles[trip.status.toLowerCase().replace('_', '')]}`}>
                  {statusLabel(trip.status)}
                </span>
              </div>
              <div className={styles.tripMeta}>
                <span>Day {dayOfTrip(trip.startDate)} of {Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86400000)}</span>
                <span>{trip.hotel}</span>
              </div>
              <div className={styles.tripFooter}>
                <span>{trip.checkIns.length} check-ins sent</span>
                <span>{formatDate(trip.startDate)} → {formatDate(trip.endDate)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showAdd && <AddTripModal onClose={() => setShowAdd(false)} onAdded={t => { setTrips(prev => [...prev, t]); setShowAdd(false) }} />}
    </div>
  )
}

function AddTripModal({ onClose, onAdded }: { onClose: () => void; onAdded: (t: TripWithRelations) => void }) {
  const [form, setForm] = useState({ coupleNames: '', destination: '', hotel: '', departureCity: '', flightDetails: '', visaStatus: '', startDate: '', endDate: '', whatsappNumber: '' })
  const [loading, setLoading] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/trips', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    onAdded(data)
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Add new trip</h2>
          <button onClick={onClose} className={styles.closeBtn}>✕</button>
        </div>
        <form onSubmit={submit} className={styles.modalForm}>
          {[
            ['coupleNames', 'Couple names (e.g. Priya & Arjun Mehta)', 'text'],
            ['destination', 'Destination', 'text'],
            ['hotel', 'Hotel', 'text'],
            ['departureCity', 'Departure city', 'text'],
            ['flightDetails', 'Flight details (optional)', 'text'],
            ['visaStatus', 'Visa status', 'text'],
            ['startDate', 'Trip start date', 'date'],
            ['endDate', 'Trip end date', 'date'],
            ['whatsappNumber', 'WhatsApp number (e.g. +919876543210)', 'tel'],
          ].map(([k, label, type]) => (
            <div key={k as string} className={styles.field}>
              <label>{label as string}</label>
              <input type={type as string} value={(form as any)[k as string]} onChange={set(k as string)} required={k !== 'flightDetails'} />
            </div>
          ))}
          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>{loading ? 'Adding...' : 'Add trip'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
