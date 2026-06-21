'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { Eye, EyeOff, Sparkles } from 'lucide-react'
import { INCOME_TYPES } from '@/lib/utils'
import { IncomeType } from '@/lib/types'

function BudgetlyLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="16" y1="16" x2="19" y2="16" strokeWidth="2.5" />
    </svg>
  )
}

const inputClass = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
const inputStyle = {
  background: '#fdf2f8',
  border: '1.5px solid #f3e8ef',
  color: '#1f172a',
  fontFamily: "'Nunito', sans-serif",
}
const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.borderColor = '#ec4899'
  e.target.style.boxShadow = '0 0 0 3px rgba(236,72,153,0.12)'
}
const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.borderColor = '#f3e8ef'
  e.target.style.boxShadow = 'none'
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
      {children}
    </label>
  )
}

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  // Shared fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Sign-up only fields
  const [repeatPassword, setRepeatPassword] = useState('')
  const [showRepeat, setShowRepeat] = useState(false)
  const [fullName, setFullName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [income, setIncome] = useState('')
  const [incomeType, setIncomeType] = useState<IncomeType>('salary')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const switchMode = (next: 'signin' | 'signup') => {
    setMode(next)
    setError(null)
    setSuccess(null)
    setRepeatPassword('')
    setFullName('')
    setDateOfBirth('')
    setIncome('')
    setIncomeType('salary')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (mode === 'signup') {
      if (password !== repeatPassword) {
        setError('Passwords do not match.')
        return
      }
      if (!fullName.trim()) {
        setError('Please enter your full name.')
        return
      }
      if (!income || parseFloat(income) <= 0) {
        setError('Please enter a valid income amount.')
        return
      }
    }

    setLoading(true)
    try {
      if (mode === 'signin') {
        const err = await signIn(email, password)
        if (err) setError(err)
      } else {
        const err = await signUp({
          email,
          password,
          fullName: fullName.trim(),
          dateOfBirth,
          income: parseFloat(income),
          incomeType,
        })
        if (err) {
          setError(err)
        } else {
          setSuccess('Account created! If asked, check your email to confirm before signing in.')
          switchMode('signin')
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
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #ec4899, transparent)' }} />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #db2777, transparent)' }} />
      </div>

      <div className="relative w-full max-w-md">
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
          <div className="flex flex-col items-center mb-6">
            <div
              className="w-16 h-16 rounded-[22px] flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg,#ec4899,#db2777)', boxShadow: '0 8px 24px rgba(236,72,153,.45)' }}
            >
              <BudgetlyLogo />
            </div>
            <h1
              className="text-3xl font-bold"
              style={{ fontFamily: "'Quicksand', sans-serif", background: 'linear-gradient(135deg,#ec4899,#db2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            >
              Budgetly
            </h1>
            <p className="text-sm mt-1" style={{ color: '#9d174d', fontFamily: "'Nunito', sans-serif" }}>
              Your smart money companion
            </p>
          </div>

          {/* Heading */}
          <div className="mb-5 text-center">
            <h2 className="text-xl font-bold mb-1" style={{ color: '#1f172a', fontFamily: "'Quicksand', sans-serif" }}>
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-sm" style={{ color: '#6b7280' }}>
              {mode === 'signin' ? 'Sign in to continue tracking your money' : 'Set up your profile and get started'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">

            {/* Sign-up only: Full name */}
            {mode === 'signup' && (
              <div>
                <Label>Full name</Label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Sara Al-Rashidi"
                  className={inputClass}
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <Label>Email address</Label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            {/* Sign-up only: Date of birth */}
            {mode === 'signup' && (
              <div>
                <Label>Date of birth <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></Label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={e => setDateOfBirth(e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
            )}

            {/* Password */}
            <div>
              <Label>Password</Label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className={`${inputClass} pr-11`}
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg" style={{ color: '#9ca3af' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Sign-up only: Repeat password */}
            {mode === 'signup' && (
              <div>
                <Label>Repeat password</Label>
                <div className="relative">
                  <input
                    type={showRepeat ? 'text' : 'password'}
                    required
                    value={repeatPassword}
                    onChange={e => setRepeatPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    className={`${inputClass} pr-11`}
                    style={{
                      ...inputStyle,
                      borderColor: repeatPassword && repeatPassword !== password ? '#fca5a5' : '#f3e8ef',
                    }}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                  <button type="button" onClick={() => setShowRepeat(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg" style={{ color: '#9ca3af' }}>
                    {showRepeat ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {repeatPassword && repeatPassword !== password && (
                  <p className="text-xs mt-1" style={{ color: '#ef4444' }}>Passwords do not match</p>
                )}
              </div>
            )}

            {/* Sign-up only: Income */}
            {mode === 'signup' && (
              <div>
                <Label>Monthly income</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: '#9d174d' }}>KWD</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.001"
                      value={income}
                      onChange={e => setIncome(e.target.value)}
                      placeholder="0.000"
                      className={`${inputClass} pl-12`}
                      style={inputStyle}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>
                  <select
                    value={incomeType}
                    onChange={e => setIncomeType(e.target.value as IncomeType)}
                    className={`${inputClass} appearance-none`}
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  >
                    {INCOME_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                  This will appear in your income page. You can add more later.
                </p>
              </div>
            )}

            {/* Error / Success */}
            {error && (
              <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c' }}>
                {error}
              </div>
            )}
            {success && (
              <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}>
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all mt-1"
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
          <p className="text-center text-sm mt-5" style={{ color: '#6b7280' }}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
              className="font-semibold"
              style={{ color: '#ec4899' }}
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          {/* AI badge */}
          <div className="flex items-center justify-center gap-1.5 mt-5 pt-5" style={{ borderTop: '1px solid #fce7f3' }}>
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
