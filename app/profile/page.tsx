'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import { User, Lock, Save, Eye, EyeOff, CheckCircle } from 'lucide-react'

interface Profile {
  full_name: string | null
  date_of_birth: string | null
  email: string | null
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2.5 mb-5 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#ec4899,#db2777)' }}>
          {icon}
        </div>
        <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)', fontFamily: "'Quicksand', sans-serif" }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      {children}
    </div>
  )
}

const inputCls = "w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
function inputSty(disabled = false): React.CSSProperties {
  return {
    background: disabled ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
    border: '1.5px solid var(--border)',
    color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
    cursor: disabled ? 'not-allowed' : 'text',
  }
}
const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = '#ec4899'
  e.target.style.boxShadow = '0 0 0 3px rgba(236,72,153,0.1)'
}
const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = 'var(--border)'
  e.target.style.boxShadow = 'none'
}

export default function ProfilePage() {
  const { user } = useAuth()

  // Profile state
  const [profile, setProfile] = useState<Profile>({ full_name: '', date_of_birth: '', email: '' })
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load profile
  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('full_name, date_of_birth, email')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile({
            full_name: data.full_name ?? '',
            date_of_birth: data.date_of_birth ?? '',
            email: data.email ?? user.email ?? '',
          })
        }
        setProfileLoading(false)
      })
  }, [user])

  const saveProfile = async () => {
    if (!user) return
    setProfileSaving(true)
    setProfileMsg(null)
    const [{ error }] = await Promise.all([
      supabase.from('profiles').update({
        full_name: profile.full_name || null,
        date_of_birth: profile.date_of_birth || null,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id),
      supabase.auth.updateUser({ data: { full_name: profile.full_name || null } }),
    ])
    setProfileSaving(false)
    setProfileMsg(error
      ? { type: 'error', text: error.message }
      : { type: 'success', text: 'Profile updated successfully.' }
    )
    setTimeout(() => setProfileMsg(null), 4000)
  }

  const savePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' })
      return
    }
    setPasswordSaving(true)
    setPasswordMsg(null)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordSaving(false)
    if (error) {
      setPasswordMsg({ type: 'error', text: error.message })
    } else {
      setPasswordMsg({ type: 'success', text: 'Password changed successfully.' })
      setNewPassword('')
      setConfirmPassword('')
    }
    setTimeout(() => setPasswordMsg(null), 4000)
  }

  const SaveButton = ({ onClick, loading, label }: { onClick: () => void; loading: boolean; label: string }) => (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
      style={{
        background: loading ? '#f9a8d4' : 'linear-gradient(135deg,#ec4899,#db2777)',
        boxShadow: loading ? 'none' : '0 4px 14px rgba(236,72,153,.35)',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontFamily: "'Quicksand', sans-serif",
      }}
    >
      {loading
        ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        : <Save size={15} />
      }
      {loading ? 'Saving...' : label}
    </button>
  )

  const Msg = ({ msg }: { msg: { type: 'success' | 'error'; text: string } }) => (
    <div
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
      style={msg.type === 'success'
        ? { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }
        : { background: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c' }
      }
    >
      {msg.type === 'success' && <CheckCircle size={15} />}
      {msg.text}
    </div>
  )

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div className="card p-6 space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-10 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-xl">

      {/* Personal info */}
      <Section title="Personal Information" icon={<User size={16} className="text-white" />}>
        <div className="space-y-4">
          <Field label="Full name">
            <input
              type="text"
              value={profile.full_name ?? ''}
              onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
              placeholder="Your full name"
              className={inputCls}
              style={inputSty()}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </Field>
          <Field label="Date of birth">
            <input
              type="date"
              value={profile.date_of_birth ?? ''}
              onChange={e => setProfile(p => ({ ...p, date_of_birth: e.target.value }))}
              className={inputCls}
              style={inputSty()}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </Field>
          <Field label="Email address">
            <input
              type="email"
              value={profile.email ?? ''}
              disabled
              className={inputCls}
              style={inputSty(true)}
            />
            <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>Email cannot be changed.</p>
          </Field>

          <div className="flex items-center gap-3 pt-1">
            <SaveButton onClick={saveProfile} loading={profileSaving} label="Save Changes" />
            {profileMsg && <Msg msg={profileMsg} />}
          </div>
        </div>
      </Section>

      {/* Password */}
      <Section title="Change Password" icon={<Lock size={16} className="text-white" />}>
        <div className="space-y-4">
          <Field label="New password">
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className={`${inputCls} pr-11`}
                style={inputSty()}
                onFocus={onFocus}
                onBlur={onBlur}
              />
              <button
                type="button"
                onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg"
                style={{ color: 'var(--text-muted)' }}
              >
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Field>
          <Field label="Confirm new password">
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className={`${inputCls} pr-11`}
                style={{
                  ...inputSty(),
                  borderColor: confirmPassword && confirmPassword !== newPassword ? '#fca5a5' : 'var(--border)',
                }}
                onFocus={onFocus}
                onBlur={onBlur}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg"
                style={{ color: 'var(--text-muted)' }}
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-xs mt-1" style={{ color: '#ef4444' }}>Passwords do not match</p>
            )}
          </Field>

          <div className="flex items-center gap-3 pt-1">
            <SaveButton onClick={savePassword} loading={passwordSaving} label="Update Password" />
            {passwordMsg && <Msg msg={passwordMsg} />}
          </div>
        </div>
      </Section>

    </div>
  )
}
