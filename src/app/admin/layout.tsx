import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import styles from '../dashboard/layout.module.css'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') redirect('/dashboard')

  return (
    <div className={styles.root}>
      <Sidebar user={session.user as any} />
      <main className={styles.main}>{children}</main>
    </div>
  )
}
