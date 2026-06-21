import { NextRequest } from 'next/server'
import { createUserClient } from '@/lib/supabase-server'

const MYFATOORAH_BASE = 'https://apitest.myfatoorah.com'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createUserClient(token)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { paymentId } = await request.json()
  if (!paymentId) return Response.json({ error: 'Missing paymentId' }, { status: 400 })

  const apiKey = process.env.MYFATOORAH_API_KEY
  if (!apiKey) return Response.json({ error: 'Payment service not configured' }, { status: 503 })

  try {
    // Verify payment status with Myfatoorah
    const res = await fetch(`${MYFATOORAH_BASE}/v2/GetPaymentStatus`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ Key: paymentId, KeyType: 'PaymentId' }),
    })
    const json = await res.json()

    if (!json.IsSuccess) {
      return Response.json({ error: json.Message || 'Verification failed' }, { status: 400 })
    }

    const status: string = json.Data?.InvoiceStatus ?? ''
    if (status !== 'Paid') {
      return Response.json({ error: `Payment status: ${status}` }, { status: 400 })
    }

    // Activate subscription for 30 days
    const now = new Date()
    const subEnd = new Date(now)
    subEnd.setDate(subEnd.getDate() + 30)
    const nextBilling = subEnd.toISOString().split('T')[0]

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_ends_at: subEnd.toISOString(),
        next_billing_date: nextBilling,
        updated_at: now.toISOString(),
      })
      .eq('id', user.id)

    if (updateError) return Response.json({ error: updateError.message }, { status: 500 })

    return Response.json({ success: true, subscriptionEndsAt: subEnd.toISOString() })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Verification error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
