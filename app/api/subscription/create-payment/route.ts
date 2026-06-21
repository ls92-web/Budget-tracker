import { NextRequest } from 'next/server'
import { createUserClient } from '@/lib/supabase-server'

const MYFATOORAH_BASE = 'https://apitest.myfatoorah.com'

async function myfatoorahPost(path: string, body: object) {
  const apiKey = process.env.MYFATOORAH_API_KEY
  if (!apiKey) throw new Error('MYFATOORAH_API_KEY not configured')

  const res = await fetch(`${MYFATOORAH_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!json.IsSuccess) throw new Error(json.Message || 'Myfatoorah error')
  return json.Data
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createUserClient(token)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, subscription_status')
    .eq('id', user.id)
    .single()

  // Build callback URL from the incoming request host
  const host = request.headers.get('host') ?? 'localhost:3000'
  const protocol = host.startsWith('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`

  try {
    // Step 1: get available payment methods
    const initData = await myfatoorahPost('/v2/InitiatePayment', {
      InvoiceAmount: 4,
      CurrencyIso: 'KWD',
    })

    const methods: Array<{ PaymentMethodId: string; PaymentMethodEn: string }> = initData.PaymentMethods ?? []
    if (!methods.length) throw new Error('No payment methods available')

    // Prefer KNET (common in Kuwait), fall back to first available
    const knet = methods.find(m => m.PaymentMethodEn?.toLowerCase().includes('knet'))
    const method = knet ?? methods[0]

    // Step 2: execute payment to get the redirect URL
    const execData = await myfatoorahPost('/v2/ExecutePayment', {
      PaymentMethodId: method.PaymentMethodId,
      CustomerName: profile?.full_name || user.email?.split('@')[0] || 'Budgetly User',
      DisplayCurrencyIso: 'KWD',
      MobileCountryCode: '+965',
      CustomerMobile: '00000000',
      CustomerEmail: user.email ?? '',
      InvoiceValue: 4,
      CallBackUrl: `${baseUrl}/payment/callback`,
      ErrorUrl: `${baseUrl}/payment/callback?error=true`,
      Language: 'en',
      CustomerReference: user.id,
      UserDefinedField: user.id,
      SourceInfo: 'Budgetly App',
      InvoiceItems: [
        {
          ItemName: 'AI Financial Coach — 1 Month',
          Quantity: 1,
          UnitPrice: 4,
        },
      ],
    })

    // Store the invoice ID so we can verify on callback
    await supabase
      .from('profiles')
      .update({ myfatoorah_invoice_id: String(execData.InvoiceId) })
      .eq('id', user.id)

    return Response.json({ paymentUrl: execData.PaymentURL })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Payment initiation failed'
    return Response.json({ error: msg }, { status: 500 })
  }
}
