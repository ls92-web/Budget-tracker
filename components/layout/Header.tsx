'use client'

import { Menu, Sun, Moon, Bell } from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'
import { usePathname } from 'next/navigation'

const PAGE_TITLES: Record<string, [string, string]> = {
  '/': ['My Money', "Here's where you stand this month"],
  '/income': ['Money In', "What's landing in your pocket"],
  '/expenses': ['Spending', 'Where did it all go?'],
  '/budgets': ['My Limits', 'Staying in the zone'],
  '/analytics': ['The Breakdown', "Numbers don't lie"],
  '/savings': ['Goals', 'Saving up for the good stuff'],
  '/ai': ['AI Budget', 'Ask me anything about your money'],
}

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()
  const [title, subtitle] = PAGE_TITLES[pathname] || ['Budgetly', '']

  return (
    <header
      className="flex items-center justify-between px-4 md:px-7 flex-shrink-0 border-b"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border)',
        height: '60px',
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 transition-colors"
          style={{ color: 'var(--text-primary)', borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <h1
            className="font-bold tracking-tight leading-tight"
            style={{ fontFamily: "'Quicksand', sans-serif", fontSize: '21px', color: 'var(--text-primary)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs leading-none mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="w-9 h-9 rounded-full border flex items-center justify-center transition-colors"
          style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}
          aria-label="Notifications"
        >
          <Bell size={16} />
        </button>
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-full border flex items-center justify-center transition-colors"
          style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>
    </header>
  )
}
