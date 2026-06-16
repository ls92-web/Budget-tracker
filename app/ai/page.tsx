'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Sparkles, Send, User, AlertTriangle, Check } from 'lucide-react'
import { useIncome } from '@/hooks/useIncome'
import { useExpenses } from '@/hooks/useExpenses'
import { getCurrentMonth, getCurrentYear, formatCurrency } from '@/lib/utils'
import { Category } from '@/lib/types'

interface Message {
  role: 'ai' | 'user'
  text: string
}

const WELCOME: Message = {
  role: 'ai',
  text: "Hi there! I'm AI Budget, your Budgetly assistant.\n\nAsk me about your spending, or log an expense in plain English — try \"Add KD 45 at Starbucks\".",
}

const CHIPS = ['How much did I spend?', 'Biggest category?', 'Savings rate?', 'Give me a tip']
const EXAMPLES = ['Add KD 12.5 at Starbucks', 'Spent KD 85 on groceries', 'Paid KD 150 for electricity']

function BudgetlyIcon({ size = 21 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="16" y1="16" x2="19" y2="16" strokeWidth="2.5" />
    </svg>
  )
}

function guessCat(text: string): Category {
  const t = text.toLowerCase()
  if (/coffee|starbucks|caribou|costa|cafe|latte|espresso/.test(t)) return 'Coffee'
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

export default function LensAIPage() {
  const month = getCurrentMonth()
  const year = getCurrentYear()
  const { total: totalIncome } = useIncome(month, year)
  const { total: totalExpenses, categoryData, add: addExpense } = useExpenses(month, year)

  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const net = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? ((net / totalIncome) * 100).toFixed(1) : '0.0'
  const topCat = categoryData[0]

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

    // Client-side expense logging intent
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
  }, [messages, streaming, addExpense])

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
          .ai-main { height: 64vh !important; flex: none !important; }
          .ai-side { width: 100% !important; }
        }
      `}</style>

      <div style={{ fontFamily: "'Nunito', sans-serif", display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 14,
            background: 'linear-gradient(135deg,#ec4899,#f472b6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', boxShadow: '0 5px 14px rgba(236,72,153,.4)', flexShrink: 0,
          }}>
            <BudgetlyIcon size={21} />
          </div>
          <div>
            <div style={{ fontFamily: "'Quicksand',sans-serif", fontSize: 21, fontWeight: 700, color: '#4a1d3a', letterSpacing: '-.01em' }}>
              AI Budget
            </div>
            <div style={{ fontSize: 12, color: '#b07f99', marginTop: 2 }}>Ask anything about your money</div>
          </div>
        </div>

        {/* Main area */}
        <div className="ai-wrap" style={{ display: 'flex', gap: 16, height: '74vh' }}>

          {/* Chat column */}
          <div className="ai-main" style={{
            flex: 1,
            background: '#fff',
            border: '1px solid #f6d8e6',
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(219,39,119,.08)',
          }}>
            {/* Chat header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '15px 20px', borderBottom: '1px solid #f6d8e6' }}>
              <div style={{
                width: 38, height: 38, borderRadius: 12, background: '#fde6f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899', flexShrink: 0,
              }}>
                <Sparkles size={18} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#4a1d3a' }}>Budget AI</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#db2777' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#db2777', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                  Online · Ready to help
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
                      background: isUser ? '#fdecf4' : '#fde6f0',
                      color: isUser ? '#845870' : '#ec4899',
                    }}>
                      {isUser ? <User size={14} /> : <Sparkles size={14} />}
                    </div>
                    <div style={{
                      maxWidth: '78%', padding: '10px 14px', borderRadius: 16,
                      fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-line',
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
                placeholder='Ask a question or say "Add KD 50 at Whole Foods"'
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 12,
                  border: '1px solid #f6d8e6', background: '#fdecf4',
                  fontSize: 13, color: '#4a1d3a', outline: 'none',
                  fontFamily: 'inherit',
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
          <div className="ai-side" style={{ width: 250, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Spending Insights */}
            <div style={{ background: '#fff', border: '1px solid #f6d8e6', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(219,39,119,.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#4a1d3a', marginBottom: 12 }}>
                <AlertTriangle size={14} style={{ color: '#e11d48', flexShrink: 0 }} />
                Spending Insights
              </div>
              <div style={{ display: 'flex', gap: 8, padding: '9px 11px', background: '#fff6fb', borderRadius: 10, marginBottom: 7, fontSize: 11, lineHeight: 1.45, color: '#845870' }}>
                <AlertTriangle size={12} style={{ color: '#e11d48', flexShrink: 0, marginTop: 1 }} />
                {topCat
                  ? `${topCat.category} is ${topCat.percentage.toFixed(0)}% of spending — your largest category this month.`
                  : 'No spending data yet for this month.'}
              </div>
              <div style={{ display: 'flex', gap: 8, padding: '9px 11px', background: '#fff6fb', borderRadius: 10, fontSize: 11, lineHeight: 1.45, color: '#845870' }}>
                <Check size={12} style={{ color: '#db2777', flexShrink: 0, marginTop: 1 }} />
                {parseFloat(savingsRate) >= 20
                  ? `Excellent savings rate of ${savingsRate}% — well above the 20% target.`
                  : `Your savings rate is ${savingsRate}% — try to reach the 20% target.`}
              </div>
            </div>

            {/* This Month */}
            <div style={{ background: '#fff', border: '1px solid #f6d8e6', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(219,39,119,.08)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#4a1d3a', marginBottom: 10 }}>This Month</div>
              {[
                { label: 'Income', value: formatCurrency(totalIncome), color: '#db2777' },
                { label: 'Expenses', value: formatCurrency(totalExpenses), color: '#9d174d' },
                { label: 'Balance', value: formatCurrency(net), color: '#ec4899' },
              ].map((row, i, arr) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 11, padding: '6px 0',
                    borderBottom: i < arr.length - 1 ? '1px solid #fbe1ec' : 'none',
                  }}
                >
                  <span style={{ color: '#b07f99' }}>{row.label}</span>
                  <span style={{ color: row.color, fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Try Asking */}
            <div style={{ background: '#fff', border: '1px solid #f6d8e6', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(219,39,119,.08)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#4a1d3a', marginBottom: 10 }}>Try Asking</div>
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
