'use client'

import { ExpenseEntry, IncomeEntry } from '@/lib/types'
import { formatCurrency, formatShortDate, CATEGORY_COLORS } from '@/lib/utils'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Category } from '@/lib/types'

interface RecentTransactionsProps {
  expenses: ExpenseEntry[]
  income: IncomeEntry[]
}

export default function RecentTransactions({ expenses, income }: RecentTransactionsProps) {
  const combined = [
    ...expenses.map(e => ({ ...e, type: 'expense' as const })),
    ...income.map(i => ({ ...i, type: 'income' as const })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)

  if (combined.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No transactions yet</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Add income or expenses to see them here</p>
      </div>
    )
  }

  return (
    <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
      {combined.map((item, i) => {
        const isExpense = item.type === 'expense'
        const expenseItem = isExpense ? (item as ExpenseEntry) : null
        const color = expenseItem
          ? CATEGORY_COLORS[expenseItem.category as Category] || '#94a3b8'
          : '#10b981'

        return (
          <div key={item.id} className="flex items-center gap-3 py-3 stagger-item" style={{ animationDelay: `${i * 40}ms` }}>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}18` }}
            >
              {isExpense
                ? <ArrowDownRight size={16} style={{ color }} />
                : <ArrowUpRight size={16} style={{ color: '#10b981' }} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {isExpense
                  ? (expenseItem?.merchant || expenseItem?.category)
                  : (item as IncomeEntry).source}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {isExpense ? expenseItem?.category : (item as IncomeEntry).income_type}
                {' · '}
                {formatShortDate(item.date)}
              </p>
            </div>
            <span
              className="text-sm font-semibold font-mono flex-shrink-0"
              style={{ color: isExpense ? 'var(--text-primary)' : 'var(--success)' }}
            >
              {isExpense ? '-' : '+'}{formatCurrency(Number(item.amount))}
            </span>
          </div>
        )
      })}
    </div>
  )
}
