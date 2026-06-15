'use client'

import { useState, useRef, useEffect } from 'react'
import { useExpenses } from '@/hooks/useExpenses'
import { useIncome } from '@/hooks/useIncome'
import { useBudgets } from '@/hooks/useBudgets'
import {
  formatCurrency, getCurrentMonth, getCurrentYear, parseNaturalLanguageTransaction,
  autoCategorize, CATEGORY_COLORS, CATEGORIES
} from '@/lib/utils'
import { Category } from '@/lib/types'
import { Sparkles, Send, Bot, User, Zap, TrendingDown, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react'
import Button from '@/components/ui/Button'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface QuickEntry {
  amount: number
  merchant: string
  category: Category
  date: string
}

function generateInsights(
  totalIncome: number,
  totalExpenses: number,
  categoryData: Array<{ category: string; amount: number; percentage: number }>,
  budgets: Array<{ category: string; monthly_limit: number }>,
  expenses: Array<{ amount: number; category: string; merchant?: string; date: string }>
): string[] {
  const insights: string[] = []
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

  if (savingsRate < 10 && totalIncome > 0) {
    insights.push(`Your savings rate is ${savingsRate.toFixed(1)}%. Financial experts recommend saving at least 20% of income. Consider reviewing discretionary spending.`)
  } else if (savingsRate >= 20) {
    insights.push(`Excellent savings rate of ${savingsRate.toFixed(1)}%! You're on track with the 20/30/50 rule.`)
  }

  if (categoryData.length > 0) {
    const top = categoryData[0]
    insights.push(`Your largest spending category is ${top.category} at ${formatCurrency(top.amount)} (${top.percentage.toFixed(1)}% of total expenses).`)
  }

  const foodSpending = categoryData.find(c => c.category === 'Food & Dining')
  if (foodSpending && foodSpending.percentage > 30) {
    insights.push(`Food & Dining accounts for ${foodSpending.percentage.toFixed(1)}% of your spending — above the recommended 15-20%. Meal prepping could help reduce costs.`)
  }

  const recurring = expenses.filter(e => ['Bills & Subscriptions'].includes(e.category))
  if (recurring.length > 0) {
    const recurringTotal = recurring.reduce((s, e) => s + Number(e.amount), 0)
    insights.push(`You have ${formatCurrency(recurringTotal)} in bills and subscriptions. Review for unused services.`)
  }

  if (insights.length === 0) {
    insights.push('Add more transactions to get personalized spending insights.')
  }

  return insights
}

function answerQuestion(
  question: string,
  totalIncome: number,
  totalExpenses: number,
  categoryData: Array<{ category: string; amount: number; percentage: number; count: number }>,
  expenses: Array<{ amount: number; category: string; merchant?: string; date: string; notes?: string }>
): string {
  const q = question.toLowerCase()
  const balance = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

  if (q.includes('how much') && (q.includes('spend') || q.includes('spent'))) {
    if (q.includes('food') || q.includes('dining') || q.includes('restaurant')) {
      const food = categoryData.find(c => c.category === 'Food & Dining')
      return food
        ? `You spent ${formatCurrency(food.amount)} on Food & Dining this month across ${food.count} transaction${food.count !== 1 ? 's' : ''}.`
        : "No Food & Dining expenses found this month."
    }
    return `You've spent ${formatCurrency(totalExpenses)} this month. Your income is ${formatCurrency(totalIncome)}, leaving a balance of ${formatCurrency(balance)}.`
  }

  if (q.includes('balance') || q.includes('remaining') || q.includes('left')) {
    return `Your current balance is ${formatCurrency(balance)}. Income: ${formatCurrency(totalIncome)} · Expenses: ${formatCurrency(totalExpenses)}.`
  }

  if (q.includes('saving') || q.includes('savings rate')) {
    return savingsRate > 0
      ? `Your savings rate is ${savingsRate.toFixed(1)}% this month — ${savingsRate >= 20 ? 'excellent work!' : savingsRate >= 10 ? 'decent, but aim for 20%.' : 'below the recommended 20%. Consider cutting discretionary spending.'}`
      : "No income recorded this month, so savings rate can't be calculated."
  }

  if (q.includes('biggest') || q.includes('largest') || q.includes('most')) {
    const sorted = [...expenses].sort((a, b) => Number(b.amount) - Number(a.amount))
    if (sorted.length === 0) return "No expenses recorded this month."
    const top3 = sorted.slice(0, 3)
    return `Your top 3 expenses:\n${top3.map((e, i) => `${i + 1}. ${e.merchant || e.category} — ${formatCurrency(Number(e.amount))}`).join('\n')}`
  }

  if (q.includes('category') || q.includes('categories')) {
    if (categoryData.length === 0) return "No expenses recorded this month."
    return `Spending breakdown:\n${categoryData.slice(0, 6).map(c =>
      `• ${c.category}: ${formatCurrency(c.amount)} (${c.percentage.toFixed(1)}%)`
    ).join('\n')}`
  }

  if (q.includes('tip') || q.includes('advice') || q.includes('recommend') || q.includes('suggest')) {
    const tips = [
      "Follow the 50/30/20 rule: 50% needs, 30% wants, 20% savings.",
      "Track every expense for 30 days to identify patterns.",
      "Set up automatic transfers to savings on payday.",
      "Review subscriptions quarterly — cancel what you don't use.",
      "Build a 3-6 month emergency fund before investing.",
    ]
    return tips[Math.floor(Math.random() * tips.length)]
  }

  if (q.includes('total income') || q.includes('how much did i earn') || q.includes('how much i earn')) {
    return totalIncome > 0
      ? `Your total income this month is ${formatCurrency(totalIncome)}.`
      : "No income recorded this month. Add income entries in the Income section."
  }

  return `Based on this month's data:\n• Income: ${formatCurrency(totalIncome)}\n• Expenses: ${formatCurrency(totalExpenses)}\n• Balance: ${formatCurrency(balance)}\n• Savings rate: ${savingsRate.toFixed(1)}%\n\nAsk me about specific categories, your largest expenses, savings tips, or anything about your spending!`
}

export default function AIPage() {
  const month = getCurrentMonth()
  const year = getCurrentYear()
  const { entries: expenses, total: totalExpenses, categoryData, add: addExpense } = useExpenses(month, year)
  const { total: totalIncome } = useIncome(month, year)
  const { budgets } = useBudgets(month, year)

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Hello! I'm your financial AI assistant. I can help you:\n\n• Answer questions about your spending\n• Analyze your financial habits\n• Add expenses using natural language\n• Provide personalized recommendations\n\nTry asking: "How much did I spend this month?" or "Add $45 at Starbucks yesterday"`,
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [quickEntry, setQuickEntry] = useState<QuickEntry | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const insights = generateInsights(totalIncome, totalExpenses, categoryData, budgets, expenses)

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
    }])
  }

  const handleSend = async () => {
    if (!input.trim()) return
    const userMsg = input.trim()
    setInput('')
    addMessage('user', userMsg)
    setThinking(true)

    // Check if it's a transaction entry
    const isTransaction = /(\$|\d+\.?\d*)\s*(at|from|for|@)/.test(userMsg) ||
      /add\s+\$?\d/.test(userMsg.toLowerCase()) ||
      /spent\s+\$?\d/.test(userMsg.toLowerCase()) ||
      /paid\s+\$?\d/.test(userMsg.toLowerCase())

    if (isTransaction) {
      const parsed = parseNaturalLanguageTransaction(userMsg)
      if (parsed.amount) {
        const entry: QuickEntry = {
          amount: parsed.amount,
          merchant: parsed.merchant || 'Unknown',
          category: (parsed.category || autoCategorize(userMsg)) as Category,
          date: parsed.date || new Date().toISOString().split('T')[0],
        }
        setQuickEntry(entry)
        addMessage('assistant',
          `I found a transaction:\n\n• Amount: ${formatCurrency(entry.amount)}\n• Merchant: ${entry.merchant}\n• Category: ${entry.category}\n• Date: ${entry.date}\n\nShould I add this expense?`
        )
      } else {
        addMessage('assistant', "I couldn't extract an amount from that. Try something like: \"Add $25 at Chipotle\" or \"Spent $89.99 on Amazon yesterday\"")
      }
      setThinking(false)
      return
    }

    try {
      const history = messages
        .filter(m => m.id !== '0')
        .map(m => ({ role: m.role, content: m.content }))
      history.push({ role: 'user', content: userMsg })

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          context: {
            totalIncome,
            totalExpenses,
            categoryData,
            budgets,
            recentExpenses: expenses,
          },
        }),
      })

      const data = await res.json()
      if (data.reply) {
        addMessage('assistant', data.reply)
      } else {
        addMessage('assistant', 'Sorry, I had trouble getting a response. Please try again.')
      }
    } catch {
      addMessage('assistant', 'Connection error. Please check your internet and try again.')
    }

    setThinking(false)
  }

  const confirmEntry = async () => {
    if (!quickEntry) return
    await addExpense({
      amount: quickEntry.amount,
      category: quickEntry.category,
      merchant: quickEntry.merchant,
      payment_method: 'cash',
      date: quickEntry.date,
      is_recurring: false,
    })
    setQuickEntry(null)
    addMessage('assistant', `Done! Added ${formatCurrency(quickEntry.amount)} at ${quickEntry.merchant} to ${quickEntry.category}.`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const QUICK_PROMPTS = [
    "How much did I spend this month?",
    "What's my biggest expense category?",
    "What is my savings rate?",
    "Give me a money saving tip",
    "Show category breakdown",
  ]

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:h-[calc(100vh-8rem)]">
      {/* Chat panel */}
      <div className="flex-1 flex flex-col card overflow-hidden h-[70vh] lg:h-auto min-h-0">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-light)' }}>
            <Sparkles size={18} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Lens AI</p>
            <p className="text-xs" style={{ color: 'var(--success)' }}>Online · Ready to help</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-slide-in`}>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: msg.role === 'assistant' ? 'var(--accent-light)' : 'var(--bg-tertiary)',
                }}
              >
                {msg.role === 'assistant'
                  ? <Bot size={15} style={{ color: 'var(--accent)' }} />
                  : <User size={15} style={{ color: 'var(--text-muted)' }} />}
              </div>
              <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div
                  className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line"
                  style={msg.role === 'assistant'
                    ? { background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }
                    : { background: 'var(--accent)', color: 'white' }}
                >
                  {msg.content}
                </div>
                {msg.role === 'assistant' && quickEntry && msg === messages[messages.length - 1] && (
                  <div className="flex gap-2 mt-1">
                    <Button size="sm" onClick={confirmEntry} icon={<Zap size={13} />}>
                      Confirm & Add
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => { setQuickEntry(null); addMessage('assistant', 'No problem, transaction not added.') }}>
                      Cancel
                    </Button>
                  </div>
                )}
                <p className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex gap-3 animate-slide-in">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-light)' }}>
                <Bot size={15} style={{ color: 'var(--accent)' }} />
              </div>
              <div className="px-4 py-3 rounded-2xl" style={{ background: 'var(--bg-tertiary)' }}>
                <div className="flex gap-1 items-center h-4">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: 'var(--text-muted)',
                        animation: 'bounce 1.2s infinite',
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompts */}
        <div className="px-4 py-2 border-t flex gap-2 overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
          {QUICK_PROMPTS.map(p => (
            <button
              key={p}
              onClick={() => { setInput(p); }}
              className="px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-colors hover:bg-[var(--accent-light)] flex-shrink-0"
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Ask a question or say "Add $50 at Whole Foods"'
              className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
            <Button onClick={handleSend} disabled={!input.trim() || thinking} icon={<Send size={15} />} size="sm">
              Send
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar: insights + auto-categorize */}
      <div className="lg:w-72 space-y-4 lg:overflow-y-auto">
        {/* AI Insights */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={16} style={{ color: 'var(--warning)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Spending Insights</h3>
          </div>
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <div
                key={i}
                className="flex gap-2.5 p-3 rounded-xl"
                style={{ background: 'var(--bg-tertiary)' }}
              >
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Category quick view */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown size={16} style={{ color: 'var(--danger)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>This Month</h3>
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between text-xs pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Income</span>
              <span className="font-semibold font-mono" style={{ color: 'var(--success)' }}>{formatCurrency(totalIncome)}</span>
            </div>
            <div className="flex justify-between text-xs pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Expenses</span>
              <span className="font-semibold font-mono" style={{ color: 'var(--danger)' }}>{formatCurrency(totalExpenses)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: 'var(--text-muted)' }}>Balance</span>
              <span className="font-semibold font-mono" style={{ color: totalIncome - totalExpenses >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {formatCurrency(totalIncome - totalExpenses)}
              </span>
            </div>
          </div>
          {categoryData.slice(0, 4).map(cat => (
            <div key={cat.category} className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: 'var(--text-secondary)' }}>{cat.category}</span>
                <span className="font-mono" style={{ color: 'var(--text-muted)' }}>{cat.percentage.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${cat.percentage}%`, background: CATEGORY_COLORS[cat.category as Category] || '#94a3b8' }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Quick add */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} style={{ color: 'var(--accent)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Natural Language Entry</h3>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Try these examples in the chat:</p>
          {[
            '"Add $12.50 at Starbucks"',
            '"Spent $85 on groceries yesterday"',
            '"Paid $150 for electricity bill"',
          ].map(ex => (
            <button
              key={ex}
              onClick={() => setInput(ex.replace(/"/g, ''))}
              className="w-full text-left px-3 py-2 rounded-lg text-xs mb-1.5 transition-colors hover:bg-[var(--accent-light)]"
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--accent)',
                fontStyle: 'italic',
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
