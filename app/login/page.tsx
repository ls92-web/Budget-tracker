'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { Eye, EyeOff, Sparkles } from 'lucide-react'

function BudgetlyLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="16" y1="16" x2="19" y2="16" strokeWidth="2.5" />
    </svg>
  )
}

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      if (mode === 'signin') {
        const err = await signIn(email, password)
        if (err) setError(err)
      } else {
        const err = await signUp(email, password)
        if (err) {
          setError(err)
        } else {
          setSuccess('Account created! Check your email to confirm, then sign in.')
          setMode('signin')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(145deg, #fff0f8 0%, #fce7f3 50%, #fdf2f8 100%)' }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #ec4899, transparent)' }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #db2777, transparent)' }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div
          className="rounded-3xl p-8 shadow-2xl"
          style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(20px)',
            border: '1.5px solid #f9a8d4',
            boxShadow: '0 20px 60px rgba(236,72,153,0.15), 0 4px 20px rgba(0,0,0,0.06)',
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-16 h-16 rounded-[22px] flex items-center justify-center mb-4"
              style={{
                background: 'linear-gradient(135deg,#ec4899,#db2777)',
                boxShadow: '0 8px 24px rgba(236,72,153,.45)',
              }}
            >
              <BudgetlyLogo />
            </div>
            <h1
              className="text-3xl font-bold"
              style={{
                fontFamily: "'Quicksand', sans-serif",
                background: 'linear-gradient(135deg,#ec4899,#db2777)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Budgetly
            </h1>
            <p className="text-sm mt-1" style={{ color: '#9d174d', fontFamily: "'Nunito', sans-serif" }}>
              Your smart money companion
            </p>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-1" style={{ color: '#1f172a', fontFamily: "'Quicksand', sans-serif" }}>
              {mode === 'signin' ? 'Welcome back 👋' : 'Create your account'}
            </h2>
            <p className="text-sm" style={{ color: '#6b7280' }}>
              {mode === 'signin'
                ? 'Sign in to continue tracking your money'
                : 'Start managing your finances smarter'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: '#fdf2f8',
                  border: '1.5px solid #f3e8ef',
                  color: '#1f172a',
                  fontFamily: "'Nunito', sans-serif",
                }}
                onFocus={e => { e.target.style.borderColor = '#ec4899'; e.target.style.boxShadow = '0 0 0 3px rgba(236,72,153,0.12)' }}
                onBlur={e => { e.target.style.borderColor = '#f3e8ef'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: '#fdf2f8',
                    border: '1.5px solid #f3e8ef',
                    color: '#1f172a',
                    fontFamily: "'Nunito', sans-serif",
                  }}
                  onFocus={e => { e.target.style.borderColor = '#ec4899'; e.target.style.boxShadow = '0 0 0 3px rgba(236,72,153,0.12)' }}
                  onBlur={e => { e.target.style.borderColor = '#f3e8ef'; e.target.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors"
                  style={{ color: '#9ca3af' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error / Success */}
            {error && (
              <div
                className="px-4 py-3 rounded-xl text-sm"
                style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c' }}
              >
                {error}
              </div>
            )}
            {success && (
              <div
                className="px-4 py-3 rounded-xl text-sm"
                style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}
              >
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all"
              style={{
                background: loading ? '#f9a8d4' : 'linear-gradient(135deg,#ec4899,#db2777)',
                boxShadow: loading ? 'none' : '0 6px 20px rgba(236,72,153,.4)',
                fontFamily: "'Quicksand', sans-serif",
                fontSize: '15px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                mode === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="text-center text-sm mt-6" style={{ color: '#6b7280' }}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(null); setSuccess(null) }}
              className="font-semibold transition-colors"
              style={{ color: '#ec4899' }}
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          {/* AI badge */}
          <div className="flex items-center justify-center gap-1.5 mt-6 pt-6" style={{ borderTop: '1px solid #fce7f3' }}>
            <Sparkles size={12} style={{ color: '#f472b6' }} />
            <span className="text-xs" style={{ color: '#f472b6', fontFamily: "'Nunito', sans-serif" }}>
              AI Budget Coach included
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
