'use client'

import { useState, useMemo } from 'react'
import { useExpenses } from '@/hooks/useExpenses'
import { useIncome } from '@/hooks/useIncome'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts'
import { formatCurrency, CATEGORY_COLORS, getCurrentMonth, getCurrentYear, getMonthName } from '@/lib/utils'
import { Category } from '@/lib/types'
import { TrendingDown, TrendingUp, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

export default function AnalyticsPage() {
  const [month, setMonth] = useState(getCurrentMonth())
  const [year, setYear] = useState(getCurrentYear())

  const { entries: expenses, total: totalExpenses, categoryData, loading: expLoading } = useExpenses(month, year)
  const { total: totalIncome } = useIncome(month, year)

  // Daily spending
  const dailyData = useMemo(() => {
    const map: Record<string, number> = {}
    expenses.forEach(e => {
      const day = parseInt(e.date.split('-')[2])
      map[day] = (map[day] || 0) + Number(e.amount)
    })
    const days = Object.keys(map).map(Number).sort((a, b) => a - b)
    return days.map(d => ({ day: `${d}`, amount: map[d] }))
  }, [expenses])

  const dailyAvg = expenses.length > 0 && dailyData.length > 0
    ? totalExpenses / dailyData.length
    : 0

  const largest = [...expenses].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 5)

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const savingsRate = totalIncome > 0
    ? Math.max(0, ((totalIncome - totalExpenses) / totalIncome) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors" style={{ color: 'var(--text-muted)' }}>
          <ChevronLeft size={18} />
        </button>
        <h2 className="font-semibold text-base min-w-[120px] text-center" style={{ color: 'var(--text-primary)' }}>
          {getMonthName(month)} {year}
        </h2>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors" style={{ color: 'var(--text-muted)' }}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Expenses', value: formatCurrency(totalExpenses), color: 'var(--danger)', icon: <TrendingDown size={16} /> },
          { label: 'Total Income', value: formatCurrency(totalIncome), color: 'var(--success)', icon: <TrendingUp size={16} /> },
          { label: 'Daily Average', value: formatCurrency(dailyAvg), color: 'var(--accent)', icon: <Calendar size={16} /> },
          { label: 'Savings Rate', value: `${savingsRate.toFixed(1)}%`, color: '#8b5cf6', icon: <TrendingUp size={16} /> },
        ].map(item => (
          <div key={item.label} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${item.color}18`, color: item.color }}>
                {item.icon}
              </div>
            </div>
            <p className="text-xl font-semibold font-mono" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Category breakdown + daily spending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category bars */}
        <div className="card p-5">
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Spending by Category</h3>
          {categoryData.length === 0 ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {categoryData.map(cat => (
                <div key={cat.category}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span style={{ color: 'var(--text-secondary)' }}>{cat.category}</span>
                    <span className="font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(cat.amount)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${cat.percentage}%`, background: cat.color }}
                    />
                  </div>
                  <p className="text-xs mt-0.5 text-right" style={{ color: 'var(--text-muted)' }}>{cat.percentage.toFixed(1)}%</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div className="card p-5">
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Distribution</h3>
          {categoryData.length === 0 ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} paddingAngle={2} dataKey="amount">
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(v) => [formatCurrency(Number(v))]}
                  labelFormatter={(_, p) => p[0]?.payload?.category}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Daily spending chart */}
      <div className="card p-5">
        <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Daily Spending</h3>
        {dailyData.length === 0 ? (
          <div className="h-40 flex items-center justify-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No data for this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dailyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                formatter={(v) => [formatCurrency(Number(v)), 'Spent']}
                labelFormatter={l => `Day ${l}`}
              />
              <Bar dataKey="amount" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Largest expenses */}
      <div className="card p-5">
        <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Largest Expenses</h3>
        {largest.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No expenses this month</p>
        ) : (
          <div className="space-y-3">
            {largest.map((e, i) => {
              const color = CATEGORY_COLORS[e.category as Category] || '#94a3b8'
              const pct = totalExpenses > 0 ? (Number(e.amount) / totalExpenses) * 100 : 0
              return (
                <div key={e.id} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-semibold text-center" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-semibold flex-shrink-0"
                    style={{ background: `${color}18`, color }}
                  >
                    {(e.merchant || e.category).charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {e.merchant || e.category}
                      </p>
                      <span className="text-sm font-semibold font-mono ml-2 flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(Number(e.amount))}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
