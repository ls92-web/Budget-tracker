'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, TrendingUp, CreditCard, PieChart,
  Target, Wallet, Sparkles, X, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/income', label: 'Income', icon: TrendingUp },
  { href: '/expenses', label: 'Expenses', icon: CreditCard },
  { href: '/budgets', label: 'Budgets', icon: Wallet },
  { href: '/analytics', label: 'Analytics', icon: PieChart },
  { href: '/savings', label: 'Savings Goals', icon: Target },
  { href: '/ai', label: 'AI Assistant', icon: Sparkles },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

function MoneyLensLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7.5" />
      <line x1="15.6" y1="15.6" x2="21.5" y2="21.5" />
      <line x1="10" y1="6" x2="10" y2="14" />
      <path d="M12.4 7.9c-.6-.6-1.5-1-2.5-1-1.4 0-2.4.7-2.4 1.8 0 2.4 5 1.2 5 3.6 0 1.1-1.1 1.8-2.6 1.8-1 0-2-.4-2.6-1" />
    </svg>
  )
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  const content = (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-[14px] flex items-center justify-center text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#ec4899,#db2777)', boxShadow: '0 5px 14px rgba(236,72,153,.4)' }}
          >
            <MoneyLensLogo size={21} />
          </div>
          <span
            className="text-xl font-bold tracking-tight whitespace-nowrap"
            style={{ fontFamily: "'Quicksand', sans-serif", background: 'linear-gradient(135deg,#ec4899,#db2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
          >
            Money Lens
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

      {/* Pro tip */}
      <div className="mx-3 mb-3 rounded-xl p-3.5" style={{ background: 'var(--accent-light)' }}>
        <p className="text-[10px] font-bold mb-1 tracking-widest uppercase" style={{ color: 'var(--accent)' }}>✦ Pro Tip</p>
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Ask the AI Assistant to log expenses in plain English — try "Add $20 at Trader Joe's".
        </p>
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
