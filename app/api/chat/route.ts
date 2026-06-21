import { NextRequest } from 'next/server'

interface CategoryItem { category: string; amount: number; percentage: number }
interface BudgetItem { category: string; monthly_limit: number }
interface SavingsGoalItem { name: string; target_amount: number; current_amount: number; target_date?: string }
interface MonthPoint { month: string; income: number; expenses: number }
interface MonthSnapshot { label: string; income: number; expenses: number; net: number; savingsRate: string }

interface FinancialContext {
  currentMonth?: MonthSnapshot
  categoryBreakdown?: CategoryItem[]
  budgets?: BudgetItem[]
  savingsGoals?: SavingsGoalItem[]
  recentMonths?: MonthPoint[]
}

function buildSystemPrompt(ctx: FinancialContext | null): string {
  const lines: string[] = [
    'You are an AI Financial Coach inside Budgetly, a personal finance app for Kuwait.',
    'Currency is KWD (Kuwaiti Dinar). Always format amounts as "KWD X.XXX" with 3 decimal places.',
    '',
    '## Your coaching identity',
    '- You are a coach, not a calculator. Explain what numbers MEAN for the user\'s life, not just what they are.',
    '- Be proactive: if you spot a risk or opportunity in their data, mention it — even if they didn\'t ask.',
    '- Be warm, direct, and human. Use "you" language. Avoid jargon.',
    '- For future simulations (vacations, purchases, big goals): use their actual monthly net income to project realistic timelines. Show the math in plain language, e.g. "At your current savings pace of KWD X/month, you\'d have that in N months."',
    '- When a user asks "can I afford X?", check their net balance, savings rate, and goals — then give a real answer with a plan.',
    '- Keep answers concise. Use short paragraphs or bullet points. No walls of text.',
    '- Never give investment advice. Focus on cash flow, budgeting, spending habits, savings goals, and life decisions.',
    '',
  ]

  if (ctx) {
    lines.push('## User\'s live financial data — use this for all advice and simulations')

    if (ctx.currentMonth) {
      const m = ctx.currentMonth
      lines.push(`### This month (${m.label})`)
      lines.push(`- Income: KWD ${m.income.toFixed(3)}`)
      lines.push(`- Expenses: KWD ${m.expenses.toFixed(3)}`)
      lines.push(`- Net (what\'s left): KWD ${m.net.toFixed(3)}`)
      lines.push(`- Savings rate: ${m.savingsRate}% (healthy target is 20%+)`)
    }

    if (ctx.categoryBreakdown?.length) {
      lines.push('### Spending breakdown this month')
      for (const c of ctx.categoryBreakdown) {
        lines.push(`- ${c.category}: KWD ${c.amount.toFixed(3)} (${c.percentage.toFixed(0)}% of total spending)`)
      }
    }

    if (ctx.budgets?.length) {
      lines.push('### Budget limits the user set')
      for (const b of ctx.budgets) {
        const spent = ctx.categoryBreakdown?.find(c => c.category === b.category)?.amount ?? 0
        const pct = b.monthly_limit > 0 ? ((spent / b.monthly_limit) * 100).toFixed(0) : '0'
        const status = Number(pct) >= 90 ? '⚠️ nearly over' : Number(pct) >= 75 ? 'watch out' : 'on track'
        lines.push(`- ${b.category}: KWD ${spent.toFixed(3)} spent of KWD ${b.monthly_limit.toFixed(3)} limit (${pct}% — ${status})`)
      }
    }

    if (ctx.savingsGoals?.length) {
      lines.push('### Savings goals')
      for (const g of ctx.savingsGoals) {
        const pct = g.target_amount > 0 ? ((g.current_amount / g.target_amount) * 100).toFixed(0) : '0'
        const remaining = g.target_amount - g.current_amount
        lines.push(`- "${g.name}": KWD ${g.current_amount.toFixed(3)} / KWD ${g.target_amount.toFixed(3)} (${pct}% done, KWD ${remaining.toFixed(3)} to go)${g.target_date ? ` — target date: ${g.target_date}` : ''}`)
      }
    }

    if (ctx.recentMonths?.length) {
      lines.push('### Last few months trend')
      for (const m of ctx.recentMonths) {
        lines.push(`- ${m.month}: income KWD ${m.income.toFixed(3)}, expenses KWD ${m.expenses.toFixed(3)}, net KWD ${(m.income - m.expenses).toFixed(3)}`)
      }
    }

    lines.push('')
    lines.push('When the user asks about affording something, simulating savings, or planning a purchase — use the net monthly figure above as their baseline monthly savings capacity.')
  }

  return lines.join('\n')
}

export async function POST(request: NextRequest) {
  const { messages, financialContext } = await request.json()

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'AI assistant not configured' }, { status: 503 })
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://budgetly.vercel.app',
      'X-Title': 'Budgetly',
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b:free',
      stream: true,
      messages: [
        { role: 'system', content: buildSystemPrompt(financialContext ?? null) },
        ...messages,
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    return Response.json({ error: err }, { status: response.status })
  }

  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
