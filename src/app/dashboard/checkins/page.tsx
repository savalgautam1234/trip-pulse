'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './checkins.module.css'

interface CheckIn {
  id: string
  message: string
  language: string
  moodSignal: string
  todayEvent: string
  sentViaWA: boolean
  sentAt: string | null
  createdAt: string
  trip: { id: string; destination: string; coupleNames: string; hotel: string; status: string }
  author: { name: string | null; email: string }
  actions: { id: string; priority: string; text: string; completed: boolean }[]
}

const MOOD_LABELS: Record<string, string> = {
  happy: '😊 Happy', nervous: '😰 Nervous', frustrated: '😤 Frustrated', excited: '🤩 Excited'
}
const EVENT_LABELS: Record<string, string> = {
  hotel_checkin: 'Hotel check-in', flight: 'Flight day', activity: 'Activity day', free_day: 'Free day', checkout: 'Checkout'
}

export default function CheckInsPage() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'sent' | 'draft'>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<CheckIn | null>(null)

  useEffect(() => {
    fetch('/api/checkins')
      .then(r => r.json())
      .then(d => { setCheckIns(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = checkIns.filter(ci => {
    if (filter === 'sent' && !ci.sentViaWA) return false
    if (filter === 'draft' && ci.sentViaWA) return false
    if (search && !ci.trip.coupleNames.toLowerCase().includes(search.toLowerCase()) &&
        !ci.trip.destination.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const sentCount = checkIns.filter(c => c.sentViaWA).length
  const draftCount = checkIns.filter(c => !c.sentViaWA).length
  const highActions = checkIns.flatMap(c => c.actions).filter(a => a.priority === 'HIGH' && !a.completed).length

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>Trip Managers</div>
          <h1 className={styles.title}>Check-in History</h1>
          <p className={styles.sub}>All WhatsApp check-ins sent to couples</p>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.stat}><span>{checkIns.length}</span><label>Total check-ins</label></div>
          <div className={styles.stat}><span style={{color:'var(--teal)'}}>{sentCount}</span><label>Sent via WhatsApp</label></div>
          <div className={styles.stat}><span style={{color:'var(--amber)'}}>{draftCount}</span><label>Drafts</label></div>
          <div className={styles.stat}><span style={{color:'var(--red)'}}>{highActions}</span><label>High priority actions</label></div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Search by couple name or destination..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className={styles.filters}>
          {(['all', 'sent', 'draft'] as const).map(f => (
            <button key={f} className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? `All (${checkIns.length})` : f === 'sent' ? `✓ Sent (${sentCount})` : `Draft (${draftCount})`}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.list}>
          {loading && <div className={styles.empty}>Loading check-ins...</div>}
          {!loading && filtered.length === 0 && <div className={styles.empty}>No check-ins found</div>}
          {filtered.map(ci => (
            <div key={ci.id} className={`${styles.item} ${selected?.id === ci.id ? styles.itemActive : ''}`} onClick={() => setSelected(ci)}>
              <div className={styles.itemTop}>
                <div>
                  <div className={styles.itemCouple}>{ci.trip.coupleNames}</div>
                  <div className={styles.itemDest}>{ci.trip.destination}</div>
                </div>
                <div className={`${styles.sentBadge} ${ci.sentViaWA ? styles.sent : styles.draft}`}>
                  {ci.sentViaWA ? '✓ Sent' : 'Draft'}
                </div>
              </div>
              <div className={styles.itemMsg}>{ci.message.slice(0, 90)}...</div>
              <div className={styles.itemMeta}>
                <span>{EVENT_LABELS[ci.todayEvent] || ci.todayEvent}</span>
                <span>{new Date(ci.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {ci.actions.filter(a => a.priority === 'HIGH' && !a.completed).length > 0 && (
                <div className={styles.urgentBadge}>⚠ {ci.actions.filter(a => a.priority === 'HIGH' && !a.completed).length} urgent action{ci.actions.filter(a => a.priority === 'HIGH' && !a.completed).length > 1 ? 's' : ''}</div>
              )}
            </div>
          ))}
        </div>

        <div className={styles.detail}>
          {!selected ? (
            <div className={styles.detailEmpty}>
              <div>Select a check-in to view details</div>
            </div>
          ) : (
            <div className={styles.detailContent}>
              <div className={styles.detailHeader}>
                <div>
                  <div className={styles.detailCouple}>{selected.trip.coupleNames}</div>
                  <div className={styles.detailDest}>{selected.trip.destination} · {selected.trip.hotel}</div>
                </div>
                <Link href={`/dashboard/trips/${selected.trip.id}`} className={styles.viewTripBtn}>View trip →</Link>
              </div>

              <div className={styles.detailMeta}>
                <div className={styles.metaItem}><label>Mood</label><span>{MOOD_LABELS[selected.moodSignal] || selected.moodSignal}</span></div>
                <div className={styles.metaItem}><label>Event</label><span>{EVENT_LABELS[selected.todayEvent] || selected.todayEvent}</span></div>
                <div className={styles.metaItem}><label>Language</label><span>{selected.language}</span></div>
                <div className={styles.metaItem}><label>Status</label><span className={selected.sentViaWA ? styles.sentText : styles.draftText}>{selected.sentViaWA ? '✓ Sent via WhatsApp' : 'Draft'}</span></div>
                <div className={styles.metaItem}><label>By</label><span>{selected.author.name || selected.author.email}</span></div>
                <div className={styles.metaItem}><label>Date</label><span>{new Date(selected.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
              </div>

              <div className={styles.messageBox}>
                <div className={styles.messageLabel}>Message sent</div>
                <div className={styles.messageText}>{selected.message}</div>
                <button className={styles.copyBtn} onClick={() => navigator.clipboard.writeText(selected.message)}>⎘ Copy</button>
              </div>

              {selected.actions.length > 0 && (
                <div className={styles.actionsBox}>
                  <div className={styles.actionsLabel}>Actions ({selected.actions.length})</div>
                  {selected.actions.map(a => (
                    <div key={a.id} className={`${styles.action} ${a.completed ? styles.actionDone : ''}`}>
                      <span className={`${styles.actionPriority} ${styles[a.priority.toLowerCase()]}`}>{a.priority}</span>
                      <span className={styles.actionText}>{a.text}</span>
                      {a.completed && <span className={styles.actionCheck}>✓</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
