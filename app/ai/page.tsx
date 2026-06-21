'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  BrainCircuit, Send, User, Target, TrendingUp, TrendingDown,
  Minus, Sparkles, Lock, CheckCircle, Crown, Zap, ShieldCheck,
  BarChart3, AlertTriangle, ChevronRight, Star, RefreshCw,
} from 'lucide-react'
import { useIncome } from '@/hooks/useIncome'
import { useExpenses } from '@/hooks/useExpenses'
import { useBudgets } from '@/hooks/useBudgets'
import { useSavings } from '@/hooks/useSavings'
import { useMonthlyTrend } from '@/hooks/useMonthlyTrend'
import { useSubscription } from '@/hooks/useSubscription'
import { getCurrentMonth, getCurrentYear, formatCurrency } from '@/lib/utils'
import { Category } from '@/lib/types'
import { supabase } from '@/lib/supabase'

/* ─── Types ─────────────────────────────────────────────── */
interface Message { role: 'ai' | 'user'; text: string }

interface PaymentMethod {
  PaymentMethodId: string
  PaymentMethodEn: string
  PaymentMethodAr: string
  ServiceCharge: number
  TotalAmount: number
  ImageUrl: string
}

function PaymentModal({ methods, onSelect, onClose, loading }: {
  methods: PaymentMethod[]
  onSelect: (methodId: string) => void
  onClose: () => void
  loading: boolean
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 22, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', border: '1.5px solid #f9a8d4' }}>
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1f172a', fontFamily: "'Quicksand', sans-serif", margin: 0 }}>Choose Payment Method</h3>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>Select how you'd like to pay 4.000 KWD/month</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {methods.map(m => (
            <button
              key={m.PaymentMethodId}
              onClick={() => onSelect(m.PaymentMethodId)}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', borderRadius: 14,
                border: '1.5px solid #f3e8ef', background: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all .15s', textAlign: 'left',
                opacity: loading ? 0.6 : 1,
              }}
              onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#ec4899'; (e.currentTarget as HTMLButtonElement).style.background = '#fff6fb' } }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#f3e8ef'; (e.currentTarget as HTMLButtonElement).style.background = '#fff' }}
            >
              {m.ImageUrl && (
                <img src={m.ImageUrl} alt={m.PaymentMethodEn} style={{ width: 44, height: 28, objectFit: 'contain', borderRadius: 6, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1f172a' }}>{m.PaymentMethodEn}</div>
                {m.ServiceCharge > 0 && (
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>Service charge: {m.ServiceCharge} KWD</div>
                )}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ec4899' }}>{m.TotalAmount.toFixed(3)} KWD</div>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          style={{ marginTop: 16, width: '100%', padding: '10px', borderRadius: 12, border: '1px solid #f3e8ef', background: 'transparent', color: '#9ca3af', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

/* ─── Constants ─────────────────────────────────────────── */
const FEATURES = [
  { icon: BrainCircuit, text: 'Personalised coaching based on your real data' },
  { icon: BarChart3, text: 'Financial health score & monthly insights' },
  { icon: TrendingUp, text: 'Future cash flow simulation (vacations, goals)' },
  { icon: Target, text: 'Savings goal advisor & timeline projections' },
  { icon: ShieldCheck, text: 'Budget risk alerts & spending pattern analysis' },
  { icon: Zap, text: 'Ask anything — get a straight answer with a plan' },
]

const QUICK_ACTIONS = [
  { label: 'Analyze My Spending', prompt: 'Give me a detailed analysis of my spending this month and what it tells you about my habits.' },
  { label: 'Find Savings', prompt: 'Where can I cut back this month to save more? Be specific about amounts.' },
  { label: 'Improve Budget', prompt: 'Based on my spending, how should I adjust my budget limits?' },
  { label: 'Review Goals', prompt: 'How am I doing on my savings goals? What should I prioritize?' },
  { label: 'Monthly Checkup', prompt: 'Give me a full financial checkup for this month — health score, risks, wins, and next steps.' },
]

const CHIPS = [
  'Am I on track?',
  'Can I afford a vacation?',
  'How long to my goal?',
  'Where am I overspending?',
]

const WELCOME: Message = {
  role: 'ai',
  text: "Hey! I'm your AI Financial Coach.\n\nI can see your full financial picture — income, spending, budgets, and goals. Ask me anything: can you afford a trip? How long until you hit your savings target? Where are you leaking money? I'll give you a real answer with a concrete plan.",
}

/* ─── Helpers ───────────────────────────────────────────── */
function guessCat(text: string): Category {
  const t = text.toLowerCase()
  if (/coffee|starbucks|caribou|costa|cafe|latte/.test(t)) return 'Coffee'
  if (/restaurant|food|lunch|dinner|grocer|pizza|mcdonald|burger/.test(t)) return 'Food & Dining'
  if (/uber|lyft|gas|fuel|transport|train|bus|parking|taxi/.test(t)) return 'Transportation'
  if (/amazon|shop|clothes|mall|avenues|ikea/.test(t)) return 'Shopping'
  if (/netflix|spotify|bill|subscription|electric|internet|phone/.test(t)) return 'Bills & Subscriptions'
  if (/gym|pharmacy|doctor|health|medical/.test(t)) return 'Health'
  return 'Miscellaneous'
}

function parseAmount(text: string): number | null {
  const m = text.match(/(?:KWD|KD|\$)?\s*(\d+(?:[.,]\d{1,3})?)/i)
  return m ? parseFloat(m[1].replace(',', '.')) : null
}

function calcHealthScore(savingsRate: number, budgets: { monthly_limit: number; category: string }[], categoryData: { category: string; amount: number }[], goals: { current_amount: number; target_amount: number }[]): number {
  // Savings rate: 40 pts (20%+ = full marks)
  const savingsPts = Math.min((savingsRate / 20) * 40, 40)

  // Budget adherence: 30 pts
  let budgetPts = 30
  if (budgets.length > 0) {
    const ok = budgets.filter(b => {
      const spent = categoryData.find(c => c.category === b.category)?.amount ?? 0
      return spent <= b.monthly_limit
    }).length
    budgetPts = (ok / budgets.length) * 30
  }

  // Goal progress: 30 pts
  let goalPts = 30
  if (goals.length > 0) {
    const avg = goals.reduce((s, g) => s + Math.min(g.current_amount / (g.target_amount || 1), 1), 0) / goals.length
    goalPts = avg * 30
  }

  return Math.round(savingsPts + budgetPts + goalPts)
}

function scoreLabel(score: number) {
  if (score >= 80) return { label: 'Excellent', color: '#16a34a' }
  if (score >= 60) return { label: 'Good', color: '#2563eb' }
  if (score >= 40) return { label: 'Fair', color: '#d97706' }
  return { label: 'Needs Work', color: '#dc2626' }
}

/* ─── Sub-components ────────────────────────────────────── */
function StatusBanner({ daysLeft, isPremium, nextBilling }: { daysLeft: number | null; isPremium: boolean; nextBilling: string | null }) {
  if (isPremium) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 12, marginBottom: 16, background: 'linear-gradient(135deg,#1a1a2e,#16213e)', color: '#fff' }}>
        <Crown size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 600 }}>Premium Active</span>
        {nextBilling && <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto' }}>Renews {nextBilling}</span>}
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 12, marginBottom: 16, background: 'linear-gradient(135deg,#6d28d9,#7c3aed)', color: '#fff' }}>
      <Star size={16} style={{ color: '#fde68a', flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 600 }}>Free Trial</span>
      <span style={{ fontSize: 11, color: '#ddd6fe' }}>
        {daysLeft !== null ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining` : ''}
      </span>
      <span style={{ marginLeft: 'auto', fontSize: 11, background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: 20, cursor: 'pointer' }}>Upgrade</span>
    </div>
  )
}

function InsightCard({ icon: Icon, color, title, body }: { icon: React.ElementType; color: string; title: string; body: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #f6d8e6', borderRadius: 12, padding: '12px 14px', boxShadow: '0 1px 3px rgba(219,39,119,.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} style={{ color }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#4a1d3a' }}>{title}</span>
      </div>
      <p style={{ fontSize: 11, color: '#845870', lineHeight: 1.5, margin: 0 }}>{body}</p>
    </div>
  )
}

/* ─── Paywall ────────────────────────────────────────────── */
function Paywall({ onTrial, onSubscribe, loading }: { onTrial: () => void; onSubscribe: () => void; loading: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%', padding: '24px 0' }}>
      <div style={{ maxWidth: 480, width: '100%' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 22, margin: '0 auto 16px',
            background: 'linear-gradient(135deg,#ec4899,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 12px 32px rgba(236,72,153,.35)',
          }}>
            <BrainCircuit size={32} style={{ color: '#fff' }} />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#1f172a', fontFamily: "'Quicksand', sans-serif", marginBottom: 8 }}>
            AI Financial Coach
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
            Your personal money advisor — knows your income, tracks your goals,<br />
            and helps you make smarter financial decisions.
          </p>
        </div>

        {/* Features */}
        <div style={{ background: '#fff', border: '1px solid #f6d8e6', borderRadius: 18, padding: '20px 24px', marginBottom: 20, boxShadow: '0 2px 12px rgba(219,39,119,.08)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fde6f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <Icon size={14} style={{ color: '#ec4899' }} />
                </div>
                <span style={{ fontSize: 12, color: '#4a1d3a', lineHeight: 1.45 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div style={{
          background: 'linear-gradient(135deg,#1a1a2e,#16213e)',
          borderRadius: 18, padding: '20px 24px', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Monthly subscription</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: '#fff', fontFamily: "'Quicksand', sans-serif" }}>4</span>
              <span style={{ fontSize: 16, color: '#f9a8d4', fontWeight: 600 }}>KWD</span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>/month</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', borderRadius: 8, padding: '4px 10px', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: '#c4b5fd', fontWeight: 600 }}>3-day free trial</span>
            </div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>Cancel anytime</div>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={onTrial}
            disabled={loading}
            style={{
              padding: '14px', borderRadius: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', color: '#fff',
              fontSize: 14, fontWeight: 700, fontFamily: "'Quicksand', sans-serif",
              boxShadow: '0 6px 20px rgba(139,92,246,.4)',
              opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Star size={16} /> Start Free 3-Day Trial
          </button>
          <button
            onClick={onSubscribe}
            disabled={loading}
            style={{
              padding: '14px', borderRadius: 14, border: '1.5px solid #f6d8e6', cursor: loading ? 'not-allowed' : 'pointer',
              background: '#fff', color: '#ec4899',
              fontSize: 14, fontWeight: 700, fontFamily: "'Quicksand', sans-serif",
              opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Crown size={16} /> Subscribe Now — 4 KWD/month
          </button>
          <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>
            No payment required to start your trial. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─── Main page ─────────────────────────────────────────── */
export default function FinancialCoachPage() {
  const month = getCurrentMonth()
  const year = getCurrentYear()
  const { total: totalIncome } = useIncome(month, year)
  const { total: totalExpenses, categoryData, add: addExpense } = useExpenses(month, year)
  const { budgets } = useBudgets(month, year)
  const { goals } = useSavings()
  const trend = useMonthlyTrend(4)
  const sub = useSubscription()

  const net = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? (net / totalIncome) * 100 : 0
  const healthScore = calcHealthScore(savingsRate, budgets, categoryData, goals)
  const { label: scoreText, color: scoreColor } = scoreLabel(healthScore)

  const prevMonth = trend.length >= 2 ? trend[trend.length - 2] : null
  const prevNet = prevMonth ? prevMonth.income - prevMonth.expenses : null
  const netChange = prevNet !== null && prevNet !== 0 ? ((net - prevNet) / Math.abs(prevNet)) * 100 : null

  const overBudget = budgets.filter(b => {
    const spent = categoryData.find(c => c.category === b.category)?.amount ?? 0
    return b.monthly_limit > 0 && spent / b.monthly_limit >= 0.8
  })

  const topCat = categoryData[0]

  // Build insights
  const insights = [
    topCat && {
      icon: BarChart3, color: '#ec4899',
      title: 'Top Spending Category',
      body: `${topCat.category} accounts for ${topCat.percentage.toFixed(0)}% of your spending (${formatCurrency(topCat.amount)}). ${topCat.percentage > 50 ? 'This is unusually high — consider reviewing.' : 'This looks reasonable.'}`,
    },
    {
      icon: savingsRate >= 20 ? TrendingUp : savingsRate >= 10 ? Minus : TrendingDown,
      color: savingsRate >= 20 ? '#16a34a' : savingsRate >= 10 ? '#d97706' : '#dc2626',
      title: 'Savings Rate',
      body: savingsRate >= 20
        ? `You're saving ${savingsRate.toFixed(1)}% of your income — above the 20% target. Great discipline!`
        : savingsRate >= 10
          ? `You're saving ${savingsRate.toFixed(1)}%. Push toward 20% by trimming your top category.`
          : totalIncome === 0
            ? 'No income logged yet this month. Add your income to unlock insights.'
            : `Only ${savingsRate.toFixed(1)}% saved. Ask me for a plan to turn this around.`,
    },
    overBudget.length > 0 && {
      icon: AlertTriangle, color: '#f59e0b',
      title: 'Budget Alert',
      body: `${overBudget.map(b => b.category).join(' and ')} ${overBudget.length === 1 ? 'is' : 'are'} at or near the budget limit. You may overspend before month end.`,
    },
    goals.length > 0 && (() => {
      const closest = goals.reduce((a, b) =>
        (b.current_amount / b.target_amount) > (a.current_amount / a.target_amount) ? b : a
      )
      const pct = ((closest.current_amount / closest.target_amount) * 100).toFixed(0)
      const remaining = closest.target_amount - closest.current_amount
      return {
        icon: Target, color: '#8b5cf6',
        title: 'Closest Goal',
        body: `"${closest.name}" is ${pct}% funded. You need ${formatCurrency(remaining)} more. At your current net, you could reach it in ${net > 0 ? Math.ceil(remaining / net) : '∞'} month${Math.ceil(remaining / net) !== 1 ? 's' : ''}.`,
      }
    })(),
  ].filter(Boolean) as Array<{ icon: React.ElementType; color: string; title: string; body: string }>

  // Chat
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[] | null>(null)
  const [payingMethod, setPayingMethod] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  const financialContext = {
    currentMonth: {
      label: new Date(year, month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      income: totalIncome, expenses: totalExpenses, net, savingsRate: savingsRate.toFixed(1),
    },
    categoryBreakdown: categoryData.map(c => ({ category: c.category, amount: c.amount, percentage: c.percentage })),
    budgets: budgets.map(b => ({ category: b.category, monthly_limit: b.monthly_limit })),
    savingsGoals: goals.map(g => ({ name: g.name, target_amount: g.target_amount, current_amount: g.current_amount, target_date: g.target_date })),
    recentMonths: trend.slice(0, -1),
  }

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || streaming) return
    const userMsg: Message = { role: 'user', text: trimmed }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setStreaming(true)
    setMessages(prev => [...prev, { role: 'ai', text: '' }])

    const isExpense = /(add|spent|paid|bought|log)/i.test(trimmed)
    const amount = parseAmount(trimmed)
    if (isExpense && amount !== null) {
      const cat = guessCat(trimmed)
      const atMatch = trimmed.match(/(?:at|on|for|from)\s+([A-Za-z][\w'&\s]{1,24})/i)
      try {
        await addExpense({ amount, category: cat, merchant: atMatch?.[1]?.trim() ?? cat, payment_method: 'other', date: new Date().toISOString().split('T')[0], is_recurring: false, notes: trimmed })
      } catch { /* non-blocking */ }
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })),
          financialContext,
        }),
      })
      if (!res.ok || !res.body) {
        setMessages(prev => [...prev.slice(0, -1), { role: 'ai', text: "Sorry, I couldn't connect right now." }])
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let aiText = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value, { stream: true }).split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break
          try {
            const delta = JSON.parse(data).choices?.[0]?.delta?.content ?? ''
            aiText += delta
            setMessages(prev => [...prev.slice(0, -1), { role: 'ai', text: aiText }])
          } catch { /* skip */ }
        }
      }
    } finally {
      setStreaming(false)
      inputRef.current?.focus()
    }
  }, [messages, streaming, addExpense, financialContext])

  // Subscription actions
  const handleTrial = useCallback(async () => {
    setActionLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('start-trial')
      if (error || data?.error) { alert(data?.error || error?.message || 'Failed to start trial'); return }
      sub.refetch()
    } finally {
      setActionLoading(false)
    }
  }, [sub])

  const handleSubscribe = useCallback(async () => {
    setActionLoading(true)
    try {
      // Fetch available payment methods first
      const { data, error } = await supabase.functions.invoke('create-payment')
      if (error || data?.error) { alert(data?.error || error?.message || 'Could not load payment methods'); return }
      setPaymentMethods(data.methods)
    } finally {
      setActionLoading(false)
    }
  }, [])

  const handlePay = useCallback(async (methodId: string) => {
    setPayingMethod(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', { body: { methodId } })
      if (error || data?.error) { alert(data?.error || error?.message || 'Payment failed'); return }
      window.location.href = data.paymentUrl
    } finally {
      setPayingMethod(false)
    }
  }, [])

  const isActive = sub.status === 'trial' || sub.status === 'active'

  if (sub.loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p style={{ fontSize: 13, color: '#b07f99' }}>Loading your coach…</p>
        </div>
      </div>
    )
  }

  if (!isActive) {
    return (
      <Paywall
        onTrial={handleTrial}
        onSubscribe={handleSubscribe}
        loading={actionLoading}
      />
    )
  }

  return (
    <>
      {paymentMethods && (
        <PaymentModal
          methods={paymentMethods}
          onSelect={async (methodId) => { setPaymentMethods(null); await handlePay(methodId) }}
          onClose={() => setPaymentMethods(null)}
          loading={payingMethod}
        />
      )}
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        .ai-msg { animation: fadeUp .25s ease; }
        .ai-chip:hover { background: #f0e6ff !important; }
        .qa-btn:hover { background: #fde6f0 !important; border-color: #f9a8d4 !important; }
        @media (max-width: 900px) {
          .coach-wrap { flex-direction: column !important; }
          .coach-sidebar { width: 100% !important; }
        }
      `}</style>

      <div style={{ fontFamily: "'Nunito', sans-serif", display: 'flex', flexDirection: 'column', height: '100%' }}>
        <StatusBanner
          daysLeft={sub.daysRemaining}
          isPremium={sub.status === 'active'}
          nextBilling={sub.nextBillingDate}
        />

        <div className="coach-wrap" style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>

          {/* ── Chat column ── */}
          <div style={{
            flex: 1, background: '#fff', border: '1px solid #f6d8e6',
            borderRadius: 16, display: 'flex', flexDirection: 'column',
            overflow: 'hidden', boxShadow: '0 1px 3px rgba(219,39,119,.08)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '15px 20px', borderBottom: '1px solid #f6d8e6' }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg,#ec4899,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                <BrainCircuit size={18} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#4a1d3a', fontFamily: "'Quicksand', sans-serif" }}>Financial Coach</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#8b5cf6' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                  Online · Knows your finances
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #fbe1ec' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#b07f99', letterSpacing: '0.08em', marginBottom: 8 }}>QUICK ACTIONS</div>
              <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2 }}>
                {QUICK_ACTIONS.map(qa => (
                  <button
                    key={qa.label}
                    className="qa-btn"
                    onClick={() => send(qa.prompt)}
                    disabled={streaming}
                    style={{
                      padding: '6px 12px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                      background: '#fdecf4', color: '#9d174d', border: '1px solid #fde1ec',
                      whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0,
                      fontFamily: 'inherit', transition: 'all .15s',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    <Zap size={10} /> {qa.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {messages.map((m, i) => {
                const isUser = m.role === 'user'
                return (
                  <div key={i} className="ai-msg" style={{ display: 'flex', gap: 10, flexDirection: isUser ? 'row-reverse' : 'row' }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 10, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isUser ? '#fdecf4' : 'linear-gradient(135deg,#ec4899,#8b5cf6)',
                      color: isUser ? '#845870' : '#fff',
                    }}>
                      {isUser ? <User size={14} /> : <BrainCircuit size={14} />}
                    </div>
                    <div style={{
                      maxWidth: '78%', padding: '10px 14px', borderRadius: 16,
                      fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-line',
                      background: isUser ? '#ec4899' : '#fdecf4',
                      color: isUser ? '#fff' : '#4a1d3a',
                    }}>
                      {m.text || (
                        <span style={{ display: 'flex', gap: 4, alignItems: 'center', height: 16 }}>
                          {[0, 150, 300].map(delay => (
                            <span key={delay} style={{ width: 5, height: 5, borderRadius: '50%', background: '#ec4899', display: 'inline-block', animation: `pulse 1s ${delay}ms infinite` }} />
                          ))}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Chips */}
            <div style={{ display: 'flex', gap: 7, padding: '10px 16px', overflowX: 'auto', borderTop: '1px solid #fbe1ec' }}>
              {CHIPS.map(chip => (
                <button key={chip} className="ai-chip" onClick={() => send(chip)} disabled={streaming}
                  style={{ padding: '7px 13px', borderRadius: 10, fontSize: 11, background: '#f3e8ff', color: '#6d28d9', border: '1px solid #e9d5ff', whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit', transition: 'background .15s' }}>
                  {chip}
                </button>
              ))}
            </div>

            {/* Composer */}
            <div style={{ display: 'flex', gap: 8, padding: '14px 16px', borderTop: '1px solid #f6d8e6' }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') send(input) }}
                disabled={streaming}
                placeholder='Ask anything — "Can I afford a trip to Turkey in 3 months?"'
                style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1px solid #f6d8e6', background: '#fdecf4', fontSize: 13, color: '#4a1d3a', outline: 'none', fontFamily: 'inherit' }}
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || streaming}
                style={{
                  padding: '10px 18px', borderRadius: 999,
                  background: 'linear-gradient(135deg,#ec4899,#8b5cf6)',
                  color: '#fff', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                  boxShadow: '0 4px 12px rgba(236,72,153,.38)',
                  opacity: !input.trim() || streaming ? 0.5 : 1,
                  transition: 'opacity .15s',
                }}
              >
                <Send size={14} /> Send
              </button>
            </div>
          </div>

          {/* ── Right sidebar ── */}
          <div className="coach-sidebar" style={{ width: 268, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>

            {/* Health Score */}
            <div style={{ background: '#fff', border: '1px solid #f6d8e6', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(219,39,119,.08)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4a1d3a', marginBottom: 12, fontFamily: "'Quicksand', sans-serif" }}>Financial Health Score</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
                  background: `conic-gradient(${scoreColor} ${healthScore * 3.6}deg, #f3e8ef 0deg)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 0 4px #fff, 0 0 0 6px ${scoreColor}22`,
                }}>
                  <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: scoreColor, fontFamily: "'Quicksand', sans-serif" }}>{healthScore}</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: scoreColor, fontFamily: "'Quicksand', sans-serif" }}>{scoreText}</div>
                  <div style={{ fontSize: 10, color: '#b07f99', marginTop: 4, lineHeight: 1.4 }}>out of 100</div>
                </div>
              </div>
              {/* Score components */}
              {[
                { label: 'Savings Rate', pct: Math.min((savingsRate / 20) * 100, 100), color: '#16a34a' },
                { label: 'Budget Control', pct: budgets.length ? (budgets.filter(b => (categoryData.find(c => c.category === b.category)?.amount ?? 0) <= b.monthly_limit).length / budgets.length) * 100 : 100, color: '#2563eb' },
                { label: 'Goal Progress', pct: goals.length ? (goals.reduce((s, g) => s + Math.min(g.current_amount / (g.target_amount || 1), 1), 0) / goals.length) * 100 : 100, color: '#8b5cf6' },
              ].map(row => (
                <div key={row.label} style={{ marginBottom: 7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
                    <span style={{ color: '#845870' }}>{row.label}</span>
                    <span style={{ color: row.color, fontWeight: 600 }}>{row.pct.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: 4, background: '#f3e8ef', borderRadius: 99 }}>
                    <div style={{ height: '100%', width: `${row.pct}%`, background: row.color, borderRadius: 99, transition: 'width .5s' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* AI Insights */}
            {insights.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #f6d8e6', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(219,39,119,.08)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#4a1d3a', marginBottom: 10, fontFamily: "'Quicksand', sans-serif", display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Sparkles size={13} style={{ color: '#ec4899' }} /> AI Insights
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
                </div>
              </div>
            )}

            {/* Savings Goals */}
            {goals.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #f6d8e6', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(219,39,119,.08)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#4a1d3a', marginBottom: 10, fontFamily: "'Quicksand', sans-serif", display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Target size={13} style={{ color: '#ec4899' }} /> Savings Goals
                </div>
                {goals.slice(0, 3).map(g => {
                  const pct = g.target_amount > 0 ? Math.min((g.current_amount / g.target_amount) * 100, 100) : 0
                  return (
                    <div key={g.id} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                        <span style={{ color: '#4a1d3a', fontWeight: 600, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</span>
                        <span style={{ color: '#b07f99' }}>{pct.toFixed(0)}%</span>
                      </div>
                      <div style={{ height: 5, background: '#f3e8ef', borderRadius: 99 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: g.color || '#ec4899', borderRadius: 99, transition: 'width .4s' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginTop: 3 }}>
                        <span style={{ color: '#b07f99' }}>{formatCurrency(g.current_amount)}</span>
                        <span style={{ color: '#b07f99' }}>{formatCurrency(g.target_amount)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Subscription management */}
            <div style={{ background: '#fff', border: '1px solid #f6d8e6', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(219,39,119,.08)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4a1d3a', marginBottom: 10, fontFamily: "'Quicksand', sans-serif", display: 'flex', alignItems: 'center', gap: 5 }}>
                <Crown size={13} style={{ color: '#f59e0b' }} /> Plan
              </div>
              <div style={{ fontSize: 11, color: '#845870', lineHeight: 1.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Status</span>
                  <span style={{ fontWeight: 600, color: sub.status === 'active' ? '#16a34a' : '#8b5cf6' }}>
                    {sub.status === 'active' ? 'Premium' : `Trial (${sub.daysRemaining}d left)`}
                  </span>
                </div>
                {sub.nextBillingDate && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Next billing</span>
                    <span style={{ fontWeight: 600 }}>{sub.nextBillingDate}</span>
                  </div>
                )}
                {sub.status === 'trial' && (
                  <button
                    onClick={handleSubscribe}
                    disabled={actionLoading}
                    style={{ marginTop: 10, width: '100%', padding: '8px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#ec4899,#8b5cf6)', color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <Crown size={12} /> Upgrade to Premium
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
