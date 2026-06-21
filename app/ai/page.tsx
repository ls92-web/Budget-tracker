'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { BrainCircuit, Send, User, Target, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useIncome } from '@/hooks/useIncome'
import { useExpenses } from '@/hooks/useExpenses'
import { useBudgets } from '@/hooks/useBudgets'
import { useSavings } from '@/hooks/useSavings'
import { useMonthlyTrend } from '@/hooks/useMonthlyTrend'
import { getCurrentMonth, getCurrentYear, formatCurrency } from '@/lib/utils'
import { Category } from '@/lib/types'

interface Message {
  role: 'ai' | 'user'
  text: string
}

const WELCOME: Message = {
  role: 'ai',
  text: "Hey! I'm your Financial Coach.\n\nI can see your real income, spending, budgets, and savings goals — so ask me anything. Want to know if you can afford that vacation? How long until your savings goal is done? Where you're overspending? I'll give you a straight answer with a plan.",
}

const CHIPS = [
  'Am I on track this month?',
  'Where am I overspending?',
  'Can I afford a vacation?',
  'How long to reach my goal?',
]

const EXAMPLES = [
  'Can I afford a new laptop next month?',
  'How long until I save KWD 1,000?',
  'What should I cut to save more?',
]

function CoachIcon({ size = 21 }: { size?: number }) {
  return <BrainCircuit size={size} />
}

function guessCat(text: string): Category {
  const t = text.toLowerCase()
  if (/coffee|starbucks|caribou|costa|cafe|latte/.test(t)) return 'Coffee'
  if (/restaurant|food|lunch|dinner|grocer|pizza|mcdonald|burger|sushi/.test(t)) return 'Food & Dining'
  if (/uber|lyft|gas|fuel|transport|train|bus|parking|taxi|careem/.test(t)) return 'Transportation'
  if (/amazon|target|store|shop|clothes|mall|avenues|ikea/.test(t)) return 'Shopping'
  if (/netflix|spotify|bill|subscription|electric|internet|phone|utility/.test(t)) return 'Bills & Subscriptions'
  if (/gym|pharmacy|doctor|health|medical|dentist/.test(t)) return 'Health'
  if (/gift|birthday|present/.test(t)) return 'Gifts'
  if (/charity|donate|donation/.test(t)) return 'Charity'
  return 'Miscellaneous'
}

function parseAmount(text: string): number | null {
  const m = text.match(/(?:KWD|KD|\$)?\s*(\d+(?:[.,]\d{1,3})?)/i)
  return m ? parseFloat(m[1].replace(',', '.')) : null
}

function HealthBar({ pct }: { pct: number }) {
  const color = pct >= 20 ? '#16a34a' : pct >= 10 ? '#d97706' : '#dc2626'
  return (
    <div style={{ height: 6, background: '#f3e8ef', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(pct * 5, 100)}%`, background: color, borderRadius: 99, transition: 'width .4s' }} />
    </div>
  )
}

export default function FinancialCoachPage() {
  const month = getCurrentMonth()
  const year = getCurrentYear()
  const { total: totalIncome } = useIncome(month, year)
  const { total: totalExpenses, categoryData, add: addExpense } = useExpenses(month, year)
  const { budgets } = useBudgets(month, year)
  const { goals } = useSavings()
  const trend = useMonthlyTrend(4)

  const net = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? ((net / totalIncome) * 100) : 0
  const savingsRateStr = savingsRate.toFixed(1)

  const prevMonth = trend.length >= 2 ? trend[trend.length - 2] : null
  const prevNet = prevMonth ? prevMonth.income - prevMonth.expenses : null
  const netChange = prevNet !== null && prevNet !== 0 ? ((net - prevNet) / Math.abs(prevNet)) * 100 : null

  const financialContext = {
    currentMonth: {
      label: new Date(year, month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      income: totalIncome,
      expenses: totalExpenses,
      net,
      savingsRate: savingsRateStr,
    },
    categoryBreakdown: categoryData.map(c => ({
      category: c.category,
      amount: c.amount,
      percentage: c.percentage,
    })),
    budgets: budgets.map(b => ({ category: b.category, monthly_limit: b.monthly_limit })),
    savingsGoals: goals.map(g => ({
      name: g.name,
      target_amount: g.target_amount,
      current_amount: g.current_amount,
      target_date: g.target_date,
    })),
    recentMonths: trend.slice(0, -1),
  }

  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

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
      const merchant = atMatch ? atMatch[1].trim() : cat
      try {
        await addExpense({
          amount,
          category: cat,
          merchant,
          payment_method: 'other',
          date: new Date().toISOString().split('T')[0],
          is_recurring: false,
          notes: trimmed,
        })
      } catch { /* non-blocking */ }
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(m => ({
            role: m.role === 'ai' ? 'assistant' : 'user',
            content: m.text,
          })),
          financialContext,
        }),
      })

      if (!res.ok || !res.body) {
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: 'ai', text: "Sorry, I couldn't connect right now. Please try again." },
        ])
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

  const healthLabel = savingsRate >= 20 ? 'Great shape' : savingsRate >= 10 ? 'Room to improve' : 'Needs attention'
  const healthColor = savingsRate >= 20 ? '#16a34a' : savingsRate >= 10 ? '#d97706' : '#dc2626'

  const overBudget = budgets.filter(b => {
    const spent = categoryData.find(c => c.category === b.category)?.amount ?? 0
    return spent / b.monthly_limit >= 0.9
  })

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        .ai-msg { animation: fadeUp .25s ease; }
        .ai-chip:hover { background: #f6d8e6 !important; }
        .ai-example:hover { background: #fde6f0 !important; }
        @media (max-width:820px) {
          .ai-wrap { flex-direction: column !important; }
          .ai-side { width: 100% !important; overflow-y: visible !important; }
        }
      `}</style>

      <div style={{ fontFamily: "'Nunito', sans-serif", display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="ai-wrap" style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>

          {/* Chat column */}
          <div className="ai-main" style={{
            flex: 1, background: '#fff', border: '1px solid #f6d8e6',
            borderRadius: 16, display: 'flex', flexDirection: 'column',
            overflow: 'hidden', boxShadow: '0 1px 3px rgba(219,39,119,.08)',
          }}>
            {/* Chat header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '15px 20px', borderBottom: '1px solid #f6d8e6' }}>
              <div style={{
                width: 38, height: 38, borderRadius: 12,
                background: 'linear-gradient(135deg,#ec4899,#db2777)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0,
              }}>
                <CoachIcon size={18} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#4a1d3a', fontFamily: "'Quicksand', sans-serif" }}>Financial Coach</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#db2777' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#db2777', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                  Online · Knows your finances
                </div>
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
                      background: isUser ? '#fdecf4' : 'linear-gradient(135deg,#ec4899,#db2777)',
                      color: isUser ? '#845870' : '#fff',
                    }}>
                      {isUser ? <User size={14} /> : <CoachIcon size={14} />}
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
                            <span key={delay} style={{
                              width: 5, height: 5, borderRadius: '50%', background: '#ec4899',
                              display: 'inline-block', animation: `pulse 1s ${delay}ms infinite`,
                            }} />
                          ))}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Quick-reply chips */}
            <div style={{ display: 'flex', gap: 7, padding: '10px 16px', overflowX: 'auto', borderTop: '1px solid #fbe1ec' }}>
              {CHIPS.map(chip => (
                <button
                  key={chip}
                  className="ai-chip"
                  onClick={() => send(chip)}
                  disabled={streaming}
                  style={{
                    padding: '7px 13px', borderRadius: 10, fontSize: 11,
                    background: '#fdecf4', color: '#845870', border: '1px solid #f6d8e6',
                    whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0,
                    fontFamily: 'inherit', transition: 'background .15s',
                  }}
                >
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
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 12,
                  border: '1px solid #f6d8e6', background: '#fdecf4',
                  fontSize: 13, color: '#4a1d3a', outline: 'none', fontFamily: 'inherit',
                }}
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || streaming}
                style={{
                  padding: '10px 18px', borderRadius: 999,
                  background: 'linear-gradient(135deg,#ec4899,#db2777)',
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

          {/* Sidebar */}
          <div className="ai-side" style={{ width: 250, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>

            {/* Financial Health */}
            <div style={{ background: '#fff', border: '1px solid #f6d8e6', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(219,39,119,.08)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4a1d3a', marginBottom: 10, fontFamily: "'Quicksand', sans-serif" }}>Financial Health</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: healthColor }}>{healthLabel}</span>
                <span style={{ fontSize: 11, color: '#b07f99' }}>Savings {savingsRateStr}%</span>
              </div>
              <HealthBar pct={savingsRate} />
              <div style={{ marginTop: 10, fontSize: 11, color: '#845870', lineHeight: 1.5 }}>
                {savingsRate >= 20
                  ? `You're saving ${savingsRateStr}% of your income — above the 20% target. Keep it up.`
                  : savingsRate >= 10
                    ? `You're saving ${savingsRateStr}%. Push to 20% by trimming your top spending category.`
                    : totalIncome === 0
                      ? 'No income logged this month yet.'
                      : `Only ${savingsRateStr}% saved this month. Ask me how to turn this around.`
                }
              </div>
              {netChange !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 11, color: netChange >= 0 ? '#16a34a' : '#dc2626' }}>
                  {netChange >= 0
                    ? <TrendingUp size={12} />
                    : netChange < -0.5
                      ? <TrendingDown size={12} />
                      : <Minus size={12} />
                  }
                  {Math.abs(netChange).toFixed(0)}% vs last month
                </div>
              )}
            </div>

            {/* This Month */}
            <div style={{ background: '#fff', border: '1px solid #f6d8e6', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(219,39,119,.08)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4a1d3a', marginBottom: 10, fontFamily: "'Quicksand', sans-serif" }}>This Month</div>
              {[
                { label: 'Income', value: formatCurrency(totalIncome), color: '#16a34a' },
                { label: 'Spent', value: formatCurrency(totalExpenses), color: '#9d174d' },
                { label: 'Left over', value: formatCurrency(net), color: net >= 0 ? '#db2777' : '#dc2626' },
              ].map((row, i, arr) => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 11, padding: '6px 0',
                  borderBottom: i < arr.length - 1 ? '1px solid #fbe1ec' : 'none',
                }}>
                  <span style={{ color: '#b07f99' }}>{row.label}</span>
                  <span style={{ color: row.color, fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
              {overBudget.length > 0 && (
                <div style={{ marginTop: 10, padding: '8px 10px', background: '#fff1f2', borderRadius: 8, fontSize: 11, color: '#9f1239', lineHeight: 1.45 }}>
                  ⚠️ {overBudget.map(b => b.category).join(', ')} {overBudget.length === 1 ? 'is' : 'are'} near the budget limit.
                </div>
              )}
            </div>

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
                        <span style={{ color: '#4a1d3a', fontWeight: 600, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</span>
                        <span style={{ color: '#b07f99' }}>{pct.toFixed(0)}%</span>
                      </div>
                      <div style={{ height: 5, background: '#f3e8ef', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: g.color || '#ec4899', borderRadius: 99, transition: 'width .4s' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Try Asking */}
            <div style={{ background: '#fff', border: '1px solid #f6d8e6', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(219,39,119,.08)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4a1d3a', marginBottom: 10, fontFamily: "'Quicksand', sans-serif" }}>Try Asking</div>
              {EXAMPLES.map(ex => (
                <button
                  key={ex}
                  className="ai-example"
                  onClick={() => send(ex)}
                  disabled={streaming}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '8px 11px', borderRadius: 9, background: '#fff6fb',
                    fontSize: 11, color: '#ec4899', fontStyle: 'italic',
                    border: 'none', cursor: 'pointer', marginBottom: 6,
                    fontFamily: 'inherit', transition: 'background .15s',
                  }}
                >
                  &ldquo;{ex}&rdquo;
                </button>
              ))}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
