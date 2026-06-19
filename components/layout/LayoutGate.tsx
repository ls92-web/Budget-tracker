'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import AppShell from './AppShell'

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-12 h-12 rounded-[18px] flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#ec4899,#db2777)', boxShadow: '0 6px 20px rgba(236,72,153,.4)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="16" y1="16" x2="19" y2="16" strokeWidth="2.5" />
          </svg>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: '#ec4899',
                animation: 'bounce 1.2s infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LayoutGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isAuthPage = pathname === '/login'

  useEffect(() => {
    if (loading) return
    if (!user && !isAuthPage) router.replace('/login')
    if (user && isAuthPage) router.replace('/')
  }, [user, loading, isAuthPage, router])

  if (isAuthPage) return <>{children}</>
  if (loading) return <LoadingScreen />
  if (!user) return null

  return <AppShell>{children}</AppShell>
}
