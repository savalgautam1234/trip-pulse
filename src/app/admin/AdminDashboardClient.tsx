'use client'
import { useEffect, useState } from 'react'
import styles from './admin.module.css'

interface AdminStats {
  totalTrips: number
  statusCounts: Record<string, number>
  tmStats: { id: string; name: string | null; email: string; tripCount: number }[]
  recentCheckIns: any[]
  actionStats: Record<string, number>
}

export function AdminDashboardClient() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(d => { setStats(d); setLoading(false) })
  }, [])

  if (loading) return <div className={styles.loading}>Loading admin dashboard...</div>
  if (!stats) return null

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Admin Dashboard</h1>
        <p className={styles.sub}>All teams · All trips</p>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.stat}>
          <div className={styles.statNum}>{stats.totalTrips}</div>
          <div className={styles.statLabel}>Total active trips</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statNum} style={{color:'var(--teal)'}}>{stats.statusCounts['ON_TRACK'] ?? 0}</div>
          <div className={styles.statLabel}>On track</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statNum} style={{color:'var(--amber)'}}>{stats.statusCounts['NEEDS_ATTENTION'] ?? 0}</div>
          <div className={styles.statLabel}>Needs attention</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statNum} style={{color:'var(--red)'}}>{stats.statusCounts['ISSUE_FLAGGED'] ?? 0}</div>
          <div className={styles.statLabel}>Issue flagged</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statNum} style={{color:'var(--accent)'}}>{stats.actionStats['HIGH'] ?? 0}</div>
          <div className={styles.statLabel}>High-priority actions open</div>
        </div>
      </div>

      <div className={styles.twoCol}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Trip managers</div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th style={{textAlign:'right'}}>Trips</th>
              </tr>
            </thead>
            <tbody>
              {stats.tmStats.map(tm => (
                <tr key={tm.id}>
                  <td>{tm.name ?? '—'}</td>
                  <td style={{color:'var(--text2)'}}>{tm.email}</td>
                  <td style={{textAlign:'right', fontWeight:500}}>{tm.tripCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Recent check-ins</div>
          <div className={styles.checkInList}>
            {stats.recentCheckIns.map((ci: any) => (
              <div key={ci.id} className={styles.checkInItem}>
                <div className={styles.checkInMeta}>
                  <span className={styles.checkInDest}>{ci.trip.destination}</span>
                  <span className={ci.sentViaWA ? styles.sent : styles.draft}>{ci.sentViaWA ? '✓ Sent' : 'Draft'}</span>
                </div>
                <div className={styles.checkInCouple}>{ci.trip.coupleNames} · by {ci.author.name ?? ci.author.email}</div>
                <div className={styles.checkInMsg}>{ci.message.slice(0, 100)}...</div>
              </div>
            ))}
            {stats.recentCheckIns.length === 0 && <div className={styles.empty}>No check-ins yet</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
