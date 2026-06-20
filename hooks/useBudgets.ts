'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/providers/AuthProvider'
import { Budget } from '@/lib/types'

export function useBudgets(month: number, year: number) {
  const { user } = useAuth()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    setLoading(true)
    const { data } = await supabase
      .from('budgets')
      .select('*')
      .eq('month', month)
      .eq('year', year)
      .order('category')
    setBudgets(data || [])
    setLoading(false)
  }, [month, year])

  useEffect(() => { if (user) fetch() }, [fetch, user])

  const upsert = async (budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('budgets')
      .upsert({ ...budget, user_id: user!.id }, { onConflict: 'user_id,category,month,year' })
      .select()
      .single()
    if (error) throw error
    setBudgets(prev => {
      const exists = prev.find(b => b.id === data.id)
      return exists ? prev.map(b => b.id === data.id ? data : b) : [...prev, data]
    })
    return data
  }

  const remove = async (id: string) => {
    await supabase.from('budgets').delete().eq('id', id)
    setBudgets(prev => prev.filter(b => b.id !== id))
  }

  return { budgets, loading, refetch: fetch, upsert, remove }
}
