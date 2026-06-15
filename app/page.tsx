'use client'

import { useMemo } from 'react'
import { useIncome } from '@/hooks/useIncome'
import { useExpenses } from '@/hooks/useExpenses'
import { useBudgets } from '@/hooks/useBudgets'
import { useSavings } from '@/hooks/useSavings'
import StatsCard from '@/components/dashboard/StatsCard'
import SpendingChart from '@/components/dashboard/SpendingChart'
import CategoryPieChart from '@/components/dashboard/CategoryPieChart'
import RecentTransactions from '@/components/dashboard/RecentTransactions'
import BudgetHealthScore from '@/components/dashboard/BudgetHealthScore'
import { formatCurrency, getCurrentMonth, getCurrentYear, getMonthName, calculateBudgetHealth } from '@/lib/utils'
import {
  DollarSign, TrendingDown, Wallet, Percent,
  ArrowUpRight, ChevronRight
} from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  const now = new Date()
  const month = getCurrentMonth()
  const year = getCurrentYear()

  const { entries: income, loading: incomeLoading, total: totalIncome } = useIncome(month, year)
  const { entries: expenses, loading: expenseLoading, total: totalExpenses, categoryData } = useExpenses(month, year)
  const { budgets } = useBudgets(month, year)
  const { goals } = useSavings()

  // Build spending chart data (last 6 months)
  const chartData = useMemo(() => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1)
      months.push({
        month: d.toLocaleString('en-US', { month: 'short' }),
        income: 0,
        expenses: 0,
      })
    }
    return months
  }, [month, year])

  const balance = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

  // Budget health
  const budgetHealth = useMemo(() => {
    if (budgets.length === 0) return 100
    const budgetData = budgets.map(b => {
      const spent = expenses
        .filter(e => e.category === b.category)
        .reduce((sum, e) => sum + Number(e.amount), 0)
      return { limit: Number(b.monthly_limit), spent }
    })
    return calculateBudgetHealth(budgetData)
  }, [budgets, expenses])

  const isLoading = incomeLoading || expenseLoading

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {getMonthName(month)} Overview
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          href="/expenses"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--accent)' }}
        >
          <ArrowUpRight size={16} />
          Add Expense
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 h-28 skeleton" />
          ))
        ) : (
          <>
            <StatsCard
              label="Monthly Income"
              value={totalIncome}
              icon={<DollarSign size={16} />}
              color="#10b981"
            />
            <StatsCard
              label="Monthly Expenses"
              value={totalExpenses}
              icon={<TrendingDown size={16} />}
              color="#ef4444"
            />
            <StatsCard
              label="Net Balance"
              value={balance}
              icon={<Wallet size={16} />}
              color={balance >= 0 ? '#6366f1' : '#f59e0b'}
            />
            <StatsCard
              label="Savings Rate"
              value={savingsRate}
              icon={<Percent size={16} />}
              color="#8b5cf6"
              format="percent"
            />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Spending trend */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Cash Flow Trend</h3>
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Income
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> Expenses
              </span>
            </div>
          </div>
          <SpendingChart data={chartData} />
        </div>

        {/* Category breakdown */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Spending by Category</h3>
            <Link href="/analytics" className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
              View all
            </Link>
          </div>
          <CategoryPieChart data={categoryData} />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent transactions */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Recent Transactions</h3>
            <Link href="/expenses" className="text-xs flex items-center gap-1" style={{ color: 'var(--accent)' }}>
              View all <ChevronRight size={12} />
            </Link>
          </div>
          <RecentTransactions expenses={expenses.slice(0, 5)} income={income.slice(0, 5)} />
        </div>

        {/* Budget health + savings */}
        <div className="space-y-4">
          <div className="card p-5 flex flex-col items-center gap-4">
            <BudgetHealthScore score={budgetHealth} />
            <Link
              href="/budgets"
              className="w-full text-center py-2 rounded-xl text-xs font-medium transition-colors"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
            >
              Manage Budgets
            </Link>
          </div>

          {goals.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Top Goal</h3>
                <Link href="/savings" className="text-xs" style={{ color: 'var(--accent)' }}>All goals</Link>
              </div>
              {(() => {
                const g = goals[0]
                const pct = Math.min((Number(g.current_amount) / Number(g.target_amount)) * 100, 100)
                return (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{g.name}</span>
                      <span className="text-xs font-semibold" style={{ color: g.color }}>{pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: g.color, transition: 'width 0.6s ease' }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>{formatCurrency(Number(g.current_amount))}</span>
                      <span>{formatCurrency(Number(g.target_amount))}</span>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
