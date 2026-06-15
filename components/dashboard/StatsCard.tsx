'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  label: string
  value: number
  icon: React.ReactNode
  color: string
  trend?: number
  format?: 'currency' | 'percent'
  className?: string
}

export default function StatsCard({ label, value, icon, color, trend, format = 'currency', className }: StatsCardProps) {
  const displayValue = format === 'currency'
    ? formatCurrency(value)
    : `${value.toFixed(1)}%`

  return (
    <div className={cn('card p-5 flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18`, color }}
        >
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>
          {displayValue}
        </p>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {trend >= 0
              ? <TrendingUp size={12} style={{ color: 'var(--success)' }} />
              : <TrendingDown size={12} style={{ color: 'var(--danger)' }} />}
            <span className="text-xs" style={{ color: trend >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {Math.abs(trend).toFixed(1)}% vs last month
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
