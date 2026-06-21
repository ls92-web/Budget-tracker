'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function PaymentCallbackPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function verify() {
      const isError = params.get('error') === 'true'
      if (isError) {
        setStatus('error')
        setMessage('Payment was cancelled or failed. No charge was made.')
        setTimeout(() => router.push('/ai'), 3000)
        return
      }

      const paymentId = params.get('PaymentId')
      if (!paymentId) {
        setStatus('error')
        setMessage('Payment reference not found.')
        setTimeout(() => router.push('/ai'), 3000)
        return
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { paymentId },
        })

        if (error || data?.error) {
          setStatus('error')
          setMessage(data?.error || error?.message || 'Could not verify payment. Please contact support.')
          setTimeout(() => router.push('/ai'), 4000)
          return
        }

        setStatus('success')
        setMessage('Your subscription is now active. Welcome to AI Financial Coach!')
        setTimeout(() => router.push('/ai'), 2500)
      } catch {
        setStatus('error')
        setMessage('An unexpected error occurred. Please contact support.')
        setTimeout(() => router.push('/ai'), 4000)
      }
    }

    verify()
  }, [params, router])

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(145deg, #fff0f8, #fce7f3)' }}>
      <div className="bg-white rounded-3xl p-10 shadow-xl max-w-sm w-full text-center"
        style={{ border: '1.5px solid #f9a8d4' }}>
        {status === 'verifying' && (
          <>
            <Loader2 size={48} className="mx-auto mb-4 animate-spin" style={{ color: '#ec4899' }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: '#1f172a', fontFamily: "'Quicksand', sans-serif" }}>
              Verifying your payment…
            </h2>
            <p className="text-sm" style={{ color: '#6b7280' }}>Please wait, this will just take a moment.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={48} className="mx-auto mb-4" style={{ color: '#16a34a' }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: '#1f172a', fontFamily: "'Quicksand', sans-serif" }}>
              Payment successful!
            </h2>
            <p className="text-sm" style={{ color: '#6b7280' }}>{message}</p>
            <p className="text-xs mt-3" style={{ color: '#9ca3af' }}>Redirecting to your coach…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={48} className="mx-auto mb-4" style={{ color: '#dc2626' }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: '#1f172a', fontFamily: "'Quicksand', sans-serif" }}>
              Something went wrong
            </h2>
            <p className="text-sm" style={{ color: '#6b7280' }}>{message}</p>
            <p className="text-xs mt-3" style={{ color: '#9ca3af' }}>Redirecting…</p>
          </>
        )}
      </div>
    </div>
  )
}
