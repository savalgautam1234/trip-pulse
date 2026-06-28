'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TripWithRelations } from '@/types'
import { formatDate, statusLabel, tripDayStatus } from '@/lib/utils'
import styles from './page.module.css'

export default function DashboardPage() {
  const [trips, setTrips] = useState<TripWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    fetch('/api/trips').then(r => r.json()).then(d => { setTrips(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  const filtered = trips.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    if (search && !t.coupleNames.toLowerCase().includes(search.toLowerCase()) && !t.destination.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const onTrack = trips.filter(t => t.status === 'ON_TRACK').length
  const needsAttention = trips.filter(t => t.status === 'NEEDS_ATTENTION').length
  const issuesFlagged = trips.filter(t => t.status === 'ISSUE_FLAGGED').length

  // Split into active, upcoming, completed
  const today = new Date()
  const active = filtered.filter(t => new Date(t.startDate) <= today && new Date(t.endDate) >= today)
  const upcoming = filtered.filter(t => new Date(t.startDate) > today)
  const completed = filtered.filter(t => new Date(t.endDate) < today)

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

      {/* Search + Filter */}
      <div style={{display:'flex',gap:'10px',marginBottom:'1.25rem',flexWrap:'wrap'}}>
        <input
          style={{flex:1,minWidth:'200px',padding:'8px 12px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--radius)',fontSize:'13px',color:'var(--text)',outline:'none',fontFamily:'inherit'}}
          placeholder="Search by couple or destination..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <div style={{display:'flex',gap:'6px'}}>
          {[['all','All'],['ON_TRACK','On track'],['NEEDS_ATTENTION','Attention'],['ISSUE_FLAGGED','Issues']].map(([v,l]) => (
            <button key={v} onClick={() => setFilterStatus(v)}
              style={{padding:'7px 12px',background:filterStatus===v?'var(--accent)':'var(--surface)',border:'1px solid',borderColor:filterStatus===v?'var(--accent)':'var(--border)',borderRadius:'20px',fontSize:'12px',color:filterStatus===v?'white':'var(--text2)',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading trips...</div>
      ) : (
        <>
          {active.length > 0 && (
            <>
              <div style={{fontSize:'12px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.07em',color:'var(--text3)',marginBottom:'0.75rem'}}>Active now ({active.length})</div>
              <div className={styles.tripGrid} style={{marginBottom:'1.5rem'}}>
                {active.map(trip => <TripCard key={trip.id} trip={trip} />)}
              </div>
            </>
          )}
          {upcoming.length > 0 && (
            <>
              <div style={{fontSize:'12px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.07em',color:'var(--text3)',marginBottom:'0.75rem'}}>Upcoming ({upcoming.length})</div>
              <div className={styles.tripGrid} style={{marginBottom:'1.5rem'}}>
                {upcoming.map(trip => <TripCard key={trip.id} trip={trip} />)}
              </div>
            </>
          )}
          {completed.length > 0 && (
            <>
              <div style={{fontSize:'12px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.07em',color:'var(--text3)',marginBottom:'0.75rem'}}>Completed ({completed.length})</div>
              <div className={styles.tripGrid}>
                {completed.map(trip => <TripCard key={trip.id} trip={trip} />)}
              </div>
            </>
          )}
          {filtered.length === 0 && <div className={styles.empty}>No trips found</div>}
        </>
      )}

      {showAdd && <AddTripModal onClose={() => setShowAdd(false)} onAdded={t => { setTrips(prev => [...prev, t]); setShowAdd(false) }} />}
    </div>
  )
}

function TripCard({ trip }: { trip: TripWithRelations }) {
  const { label } = tripDayStatus(trip.startDate, trip.endDate)
  const today = new Date()
  const isCompleted = new Date(trip.endDate) < today
  const isUpcoming = new Date(trip.startDate) > today

  const statusClass = trip.status === 'ON_TRACK' ? styles.on_track :
    trip.status === 'NEEDS_ATTENTION' ? styles.needs_attention : styles.issue_flagged

  return (
    <Link href={`/dashboard/trips/${trip.id}`} className={styles.tripCard} style={{opacity: isCompleted ? 0.7 : 1}}>
      <div className={styles.tripTop}>
        <div>
          <div className={styles.tripDest}>{trip.destination}</div>
          <div className={styles.tripCouple}>{trip.coupleNames}</div>
        </div>
        <span className={`${styles.statusBadge} ${statusClass}`}>
          {isCompleted ? 'Completed' : isUpcoming ? 'Upcoming' : statusLabel(trip.status)}
        </span>
      </div>
      <div className={styles.tripMeta}>
        <span style={{color: isCompleted ? 'var(--text3)' : isUpcoming ? 'var(--amber)' : 'var(--text2)', fontWeight: 500}}>{label}</span>
        <span>{trip.hotel}</span>
      </div>
      <div className={styles.tripFooter}>
        <span>{trip.checkIns.length} check-ins sent</span>
        <span>{formatDate(trip.startDate)} → {formatDate(trip.endDate)}</span>
      </div>
    </Link>
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
