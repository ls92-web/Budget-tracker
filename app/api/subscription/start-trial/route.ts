import { NextRequest } from 'next/server'
import { createUserClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createUserClient(token)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if already had a trial or active subscription
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, trial_started_at')
    .eq('id', user.id)
    .single()

  if (profile?.trial_started_at || ['trial', 'active'].includes(profile?.subscription_status ?? '')) {
    return Response.json({ error: 'Trial already used or subscription active' }, { status: 400 })
  }

  const now = new Date()
  const trialEnd = new Date(now)
  trialEnd.setDate(trialEnd.getDate() + 3)

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'trial',
      trial_started_at: now.toISOString(),
      trial_ends_at: trialEnd.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true, trialEndsAt: trialEnd.toISOString() })
}
