'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface SignUpParams {
  email: string
  password: string
  fullName: string
  dateOfBirth: string
  income: number
  incomeType: string
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (params: SignUpParams) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signIn: async () => null,
  signUp: async () => null,
  signOut: async () => {},
})

async function createInitialIncomeEntry(userId: string, income: number, incomeType: string) {
  const { error } = await supabase.from('income_entries').insert({
    amount: income,
    income_type: incomeType,
    date: new Date().toISOString().split('T')[0],
    user_id: userId,
    notes: 'Initial income added during registration',
  })
  if (!error) {
    await supabase.auth.updateUser({ data: { income_entry_created: true } })
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)

      // Create initial income entry for new users who confirmed via email
      if (event === 'SIGNED_IN' && session?.user) {
        const meta = session.user.user_metadata
        if (meta?.initial_income && !meta?.income_entry_created) {
          await createInitialIncomeEntry(
            session.user.id,
            Number(meta.initial_income),
            meta.initial_income_type || 'salary',
          )
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }

  const signUp = async ({ email, password, fullName, dateOfBirth, income, incomeType }: SignUpParams): Promise<string | null> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          date_of_birth: dateOfBirth,
          initial_income: income,
          initial_income_type: incomeType,
          income_entry_created: false,
        },
      },
    })

    if (error) return error.message

    // If auto-confirmed (no email verification step), create income entry immediately
    if (data.session && data.user) {
      await createInitialIncomeEntry(data.user.id, income, incomeType)
    }

    return null
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
