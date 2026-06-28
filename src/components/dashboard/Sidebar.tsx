'use client'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Sidebar.module.css'

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null; role: string }
}

const NAV = [
  { href: '/dashboard', label: 'My Trips', icon: '✈', exact: true },
  { href: '/dashboard/reservations', label: 'Reservations AI', icon: '🗓', exact: false },
  { href: '/dashboard/customisation', label: 'Customisation AI', icon: '✏', exact: false },
  { href: '/dashboard/checkins', label: 'Check-ins', icon: '✦', exact: false },
]

const ADMIN_NAV = [
  { href: '/admin', label: 'Admin Dashboard', icon: '◈', exact: false },
]

export function Sidebar({ user }: Props) {
  const pathname = usePathname()
  const initials = (user.name ?? user.email ?? 'TM').slice(0, 2).toUpperCase()

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>30<span>Sundays</span></div>
      <div className={styles.product}>Trip Pulse</div>

      <nav className={styles.nav}>
        {NAV.map(n => (
          <Link key={n.href} href={n.href} className={`${styles.navItem} ${isActive(n.href, n.exact) ? styles.active : ''}`}>
            <span className={styles.icon}>{n.icon}</span>
            {n.label}
          </Link>
        ))}
        {user.role === 'ADMIN' && (
          <>
            <div className={styles.divider} />
            {ADMIN_NAV.map(n => (
              <Link key={n.href} href={n.href} className={`${styles.navItem} ${pathname.startsWith('/admin') ? styles.active : ''}`}>
                <span className={styles.icon}>{n.icon}</span>
                {n.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className={styles.bottom}>
        <div className={styles.user}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user.name ?? 'Trip Manager'}</div>
            <div className={styles.userRole}>{user.role === 'ADMIN' ? 'Admin' : 'Trip Manager'}</div>
          </div>
        </div>
        <button className={styles.signOut} onClick={() => signOut({ callbackUrl: '/login' })}>
          Sign out
        </button>
      </div>
    </aside>
  )
}
