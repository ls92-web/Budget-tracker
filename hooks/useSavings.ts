'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/providers/AuthProvider'
import { SavingsGoal } from '@/lib/types'

export function useSavings() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('savings_goals')
      .select('*')
      .order('created_at', { ascending: false })
    setGoals(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { if (user) fetch() }, [fetch, user])

  const add = async (goal: Omit<SavingsGoal, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('savings_goals')
      .insert({ ...goal, user_id: user!.id })
      .select()
      .single()
    if (error) throw error
    setGoals(prev => [data, ...prev])
    return data
  }

  const update = async (id: string, updates: Partial<SavingsGoal>) => {
    const { data, error } = await supabase
      .from('savings_goals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setGoals(prev => prev.map(g => g.id === id ? data : g))
    return data
  }

  const remove = async (id: string) => {
    await supabase.from('savings_goals').delete().eq('id', id)
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  return { goals, loading, refetch: fetch, add, update, remove }
}
