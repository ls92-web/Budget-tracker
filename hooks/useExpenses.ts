'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { ExpenseEntry, Category } from '@/lib/types'
import { CATEGORY_COLORS, getDaysInMonth } from '@/lib/utils'

export function useExpenses(month?: number, year?: number) {
  const [entries, setEntries] = useState<ExpenseEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('expense_entries')
        .select('*')
        .order('date', { ascending: false })

      if (month && year) {
        const start = `${year}-${String(month).padStart(2, '0')}-01`
        const lastDay = getDaysInMonth(month, year)
        const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
        query = query.gte('date', start).lte('date', end)
      }

      const { data, error: err } = await query
      if (err) throw err
      setEntries(data || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch expenses')
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => { fetch() }, [fetch])

  const add = async (entry: Omit<ExpenseEntry, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error: err } = await supabase
      .from('expense_entries')
      .insert(entry)
      .select()
      .single()
    if (err) throw err
    setEntries(prev => [data, ...prev])
    return data
  }

  const update = async (id: string, updates: Partial<ExpenseEntry>) => {
    const { data, error: err } = await supabase
      .from('expense_entries')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (err) throw err
    setEntries(prev => prev.map(e => e.id === id ? data : e))
    return data
  }

  const remove = async (id: string) => {
    const { error: err } = await supabase
      .from('expense_entries')
      .delete()
      .eq('id', id)
    if (err) throw err
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const total = entries.reduce((sum, e) => sum + Number(e.amount), 0)

  const byCategory = entries.reduce<Record<string, { amount: number; count: number; color: string }>>((acc, e) => {
    const cat = e.category
    if (!acc[cat]) acc[cat] = { amount: 0, count: 0, color: CATEGORY_COLORS[cat as Category] || '#94a3b8' }
    acc[cat].amount += Number(e.amount)
    acc[cat].count++
    return acc
  }, {})

  const categoryData = Object.entries(byCategory)
    .map(([category, { amount, count, color }]) => ({
      category,
      amount,
      count,
      color,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  return { entries, loading, error, refetch: fetch, add, update, remove, total, byCategory, categoryData }
}
