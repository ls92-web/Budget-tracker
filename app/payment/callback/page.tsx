'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CheckCircle, XCircle, Loader2, ArrowRight, RefreshCw } from 'lucide-react'

function CallbackInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function verify() {
      const isError = params.get('error') === 'true'
      if (isError) {
        setStatus('error')
        setMessage('Your payment was cancelled or could not be processed. No charge was made.')
        return
      }

      const paymentId = params.get('PaymentId') || params.get('paymentId')
      if (!paymentId) {
        setStatus('error')
        setMessage('Payment reference not found. If you were charged, please contact support.')
        return
      }

      try {
        // Wait for the session to be restored from storage after the redirect
        let session = null
        for (let i = 0; i < 10; i++) {
          const { data: { session: s } } = await supabase.auth.getSession()
          if (s) { session = s; break }
          await new Promise(r => setTimeout(r, 200))
        }

        if (!session) {
          setStatus('error')
          setMessage('Session expired. Please sign in again and contact support if you were charged.')
          return
        }

        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { paymentId },
          headers: { Authorization: `Bearer ${session.access_token}` },
        })

        // Extract the real error message from whichever place supabase-js puts it
        let errMsg: string | null = null
        if (data?.error) errMsg = data.error
        else if (error) {
          try {
            // Newer supabase-js versions put the body in error.context
            const body = await (error as { context?: Response }).context?.json?.()
            errMsg = body?.error || error.message
          } catch {
            errMsg = error.message
          }
        }

        if (errMsg) {
          setStatus('error')
          setMessage(errMsg)
          return
        }

        setStatus('success')
        setMessage(data.subscriptionEndsAt
          ? `Your subscription is active until ${new Date(data.subscriptionEndsAt).toLocaleDateString('en-KW', { day: 'numeric', month: 'long', year: 'numeric' })}.`
          : 'Your subscription is now active.')
      } catch (e) {
        setStatus('error')
        setMessage(e instanceof Error ? e.message : 'An unexpected error occurred. If you were charged, please contact support.')
      }
    }

    verify()
  }, [params])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background: status === 'success'
          ? 'linear-gradient(145deg,#f0fdf4,#dcfce7)'
          : status === 'error'
          ? 'linear-gradient(145deg,#fff1f2,#ffe4e6)'
          : 'linear-gradient(145deg,#fff0f8,#fce7f3)',
        fontFamily: "'Nunito', sans-serif",
        transition: 'background .6s ease',
      }}
    >
      <div style={{
        background: '#fff',
        borderRadius: 28,
        padding: '48px 40px',
        maxWidth: 420,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,.1)',
        border: `1.5px solid ${status === 'success' ? '#bbf7d0' : status === 'error' ? '#fecdd3' : '#f9a8d4'}`,
      }}>

        {/* ── Verifying ── */}
        {status === 'verifying' && (
          <>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
              background: 'linear-gradient(135deg,#ec4899,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 12px 32px rgba(236,72,153,.35)',
            }}>
              <Loader2 size={36} style={{ color: '#fff', animation: 'spin 1s linear infinite' }} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1f172a', fontFamily: "'Quicksand', sans-serif", marginBottom: 10 }}>
              Verifying your payment…
            </h2>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
              Please wait, this will only take a moment.
            </p>
          </>
        )}

        {/* ── Success ── */}
        {status === 'success' && (
          <>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
              background: 'linear-gradient(135deg,#22c55e,#16a34a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 12px 32px rgba(34,197,94,.35)',
            }}>
              <CheckCircle size={40} style={{ color: '#fff' }} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#14532d', fontFamily: "'Quicksand', sans-serif", marginBottom: 10 }}>
              Payment successful!
            </h2>
            <p style={{ fontSize: 14, color: '#166534', lineHeight: 1.6, marginBottom: 28 }}>
              {message}
            </p>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '14px 18px', marginBottom: 28 }}>
              <p style={{ fontSize: 13, color: '#15803d', fontWeight: 600, margin: 0 }}>
                AI Financial Coach is now unlocked
              </p>
              <p style={{ fontSize: 12, color: '#4ade80', margin: '4px 0 0' }}>
                Your personal money advisor is ready to help
              </p>
            </div>
            <button
              onClick={() => router.push('/ai')}
              style={{
                width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg,#22c55e,#16a34a)',
                color: '#fff', fontSize: 15, fontWeight: 700,
                fontFamily: "'Quicksand', sans-serif", cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 6px 20px rgba(34,197,94,.4)',
              }}
            >
              Go to My Coach <ArrowRight size={16} />
            </button>
          </>
        )}

        {/* ── Error ── */}
        {status === 'error' && (
          <>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
              background: 'linear-gradient(135deg,#f87171,#dc2626)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 12px 32px rgba(220,38,38,.35)',
            }}>
              <XCircle size={40} style={{ color: '#fff' }} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#7f1d1d', fontFamily: "'Quicksand', sans-serif", marginBottom: 10 }}>
              Payment failed
            </h2>
            <p style={{ fontSize: 14, color: '#991b1b', lineHeight: 1.6, marginBottom: 28 }}>
              {message}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => router.push('/ai')}
                style={{
                  width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg,#ec4899,#db2777)',
                  color: '#fff', fontSize: 15, fontWeight: 700,
                  fontFamily: "'Quicksand', sans-serif", cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 6px 20px rgba(236,72,153,.4)',
                }}
              >
                <RefreshCw size={15} /> Try Again
              </button>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                No charge was made to your account.
              </p>
            </div>
          </>
        )}

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(145deg,#fff0f8,#fce7f3)', fontFamily: "'Nunito', sans-serif",
      }}>
        <Loader2 size={36} style={{ color: '#ec4899', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <CallbackInner />
    </Suspense>
  )
}
