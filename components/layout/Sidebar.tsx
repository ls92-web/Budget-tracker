'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, TrendingUp, CreditCard, PieChart,
  Target, Wallet, X, ChevronRight, Sparkles, LogOut, UserCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/providers/AuthProvider'

const NAV_ITEMS = [
  { href: '/', label: 'My Money', icon: LayoutDashboard },
  { href: '/income', label: 'Money In', icon: TrendingUp },
  { href: '/expenses', label: 'Spending', icon: CreditCard },
  { href: '/budgets', label: 'My Limits', icon: Wallet },
  { href: '/analytics', label: 'The Breakdown', icon: PieChart },
  { href: '/savings', label: 'Goals', icon: Target },
  { href: '/ai', label: 'AI Budget', icon: Sparkles },
  { href: '/profile', label: 'My Profile', icon: UserCircle },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

function BudgetlyLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      {/* Wallet body */}
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
      {/* Divider */}
      <line x1="3" y1="12" x2="21" y2="12" />
      {/* Coin slot */}
      <line x1="16" y1="16" x2="19" y2="16" strokeWidth="2.5" />
    </svg>
  )
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const content = (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-[14px] flex items-center justify-center text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#ec4899,#db2777)', boxShadow: '0 5px 14px rgba(236,72,153,.4)' }}
          >
            <BudgetlyLogo size={21} />
          </div>
          <span
            className="text-xl font-bold tracking-tight whitespace-nowrap"
            style={{ fontFamily: "'Quicksand', sans-serif", background: 'linear-gradient(135deg,#ec4899,#db2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
          >
            Budgetly
          </span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg hover:opacity-70 transition-opacity"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-sm font-semibold transition-all duration-150',
                !active && 'hover:bg-[var(--bg-tertiary)]'
              )}
              style={
                active
                  ? { background: 'linear-gradient(135deg,#ec4899,#db2777)', color: '#fff', boxShadow: '0 5px 14px rgba(236,72,153,.32)' }
                  : { color: 'var(--text-secondary)' }
              }
            >
              <Icon size={17} className="flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={12} className="opacity-70" />}
            </Link>
          )
        })}
      </nav>

      {/* User + Sign out */}
      <div className="px-3 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
        {user && (
          <div className="px-3 py-2 mb-1">
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
          </div>
        )}
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-sm font-semibold transition-all duration-150 hover:bg-[var(--bg-tertiary)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          <LogOut size={17} className="flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>

    </div>
  )

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={onClose}
        />
      )}

      {/* Mobile drawer */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {content}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-60">{content}</div>
      </div>
    </>
  )
}
