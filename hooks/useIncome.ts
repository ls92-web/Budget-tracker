'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/providers/AuthProvider'
import { IncomeEntry } from '@/lib/types'
import { getDaysInMonth } from '@/lib/utils'

export function useIncome(month?: number, year?: number) {
  const { user } = useAuth()
  const [entries, setEntries] = useState<IncomeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('income_entries')
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
      setError(e instanceof Error ? e.message : 'Failed to fetch income')
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => { if (user) fetch() }, [fetch, user])

  const add = async (entry: Omit<IncomeEntry, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error: err } = await supabase
      .from('income_entries')
      .insert({ ...entry, user_id: user!.id })
      .select()
      .single()
    if (err) throw err
    setEntries(prev => [data, ...prev])
    return data
  }

  const update = async (id: string, updates: Partial<IncomeEntry>) => {
    const { data, error: err } = await supabase
      .from('income_entries')
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
      .from('income_entries')
      .delete()
      .eq('id', id)
    if (err) throw err
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const total = entries.reduce((sum, e) => sum + Number(e.amount), 0)

  return { entries, loading, error, refetch: fetch, add, update, remove, total }
}
