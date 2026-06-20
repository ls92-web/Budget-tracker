'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/providers/AuthProvider'
import { getDaysInMonth } from '@/lib/utils'

interface MonthlyPoint {
  month: string
  income: number
  expenses: number
}

export function useMonthlyTrend(numMonths = 6): MonthlyPoint[] {
  const { user } = useAuth()
  const [data, setData] = useState<MonthlyPoint[]>([])

  useEffect(() => {
    if (!user) return
    async function load() {
      const now = new Date()
      const results: MonthlyPoint[] = []

      for (let i = numMonths - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const y = d.getFullYear()
        const m = d.getMonth() + 1
        const start = `${y}-${String(m).padStart(2, '0')}-01`
        const end = `${y}-${String(m).padStart(2, '0')}-${String(getDaysInMonth(m, y)).padStart(2, '0')}`

        const [incRes, expRes] = await Promise.all([
          supabase.from('income_entries').select('amount').gte('date', start).lte('date', end),
          supabase.from('expense_entries').select('amount').gte('date', start).lte('date', end),
        ])

        results.push({
          month: d.toLocaleString('en-US', { month: 'short' }),
          income: (incRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0),
          expenses: (expRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0),
        })
      }

      setData(results)
    }
    load()
  }, [numMonths, user])

  return data
}
