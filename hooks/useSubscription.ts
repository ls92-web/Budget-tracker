'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/providers/AuthProvider'

export type SubStatus = 'none' | 'trial' | 'active' | 'expired'

export interface SubscriptionInfo {
  status: SubStatus
  trialEndsAt: Date | null
  subscriptionEndsAt: Date | null
  nextBillingDate: string | null
  daysRemaining: number | null
  loading: boolean
  refetch: () => void
}

export function useSubscription(): SubscriptionInfo {
  const { user } = useAuth()
  const [raw, setRaw] = useState<Record<string, string> | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('subscription_status, trial_started_at, trial_ends_at, subscription_ends_at, next_billing_date')
      .eq('id', user.id)
      .single()
    setRaw(data as Record<string, string> | null)
    setLoading(false)
  }, [user])

  useEffect(() => { if (user) refetch() }, [refetch, user])

  const now = new Date()
  let status: SubStatus = 'none'
  let trialEndsAt: Date | null = null
  let subscriptionEndsAt: Date | null = null
  let nextBillingDate: string | null = null
  let daysRemaining: number | null = null

  if (raw) {
    if (raw.trial_ends_at) trialEndsAt = new Date(raw.trial_ends_at)
    if (raw.subscription_ends_at) subscriptionEndsAt = new Date(raw.subscription_ends_at)
    if (raw.next_billing_date) nextBillingDate = raw.next_billing_date

    if (raw.subscription_status === 'active' && subscriptionEndsAt && subscriptionEndsAt > now) {
      status = 'active'
      daysRemaining = Math.ceil((subscriptionEndsAt.getTime() - now.getTime()) / 86400000)
    } else if (raw.subscription_status === 'trial' && trialEndsAt && trialEndsAt > now) {
      status = 'trial'
      daysRemaining = Math.ceil((trialEndsAt.getTime() - now.getTime()) / 86400000)
    } else if (['trial', 'active'].includes(raw.subscription_status)) {
      status = 'expired'
    }
  }

  return { status, trialEndsAt, subscriptionEndsAt, nextBillingDate, daysRemaining, loading, refetch }
}
