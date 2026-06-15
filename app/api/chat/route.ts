import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const { messages, context } = await req.json()

  const systemPrompt = `You are Lens AI, a friendly and knowledgeable personal finance assistant for the Money Lens app. You help users understand their spending, manage budgets, and reach their financial goals.

Here is the user's current financial data for this month:
- Total Income: $${context.totalIncome.toFixed(2)}
- Total Expenses: $${context.totalExpenses.toFixed(2)}
- Net Balance: $${(context.totalIncome - context.totalExpenses).toFixed(2)}
- Savings Rate: ${context.totalIncome > 0 ? (((context.totalIncome - context.totalExpenses) / context.totalIncome) * 100).toFixed(1) : '0.0'}%

Top spending categories:
${context.categoryData.slice(0, 6).map((c: { category: string; amount: number; percentage: number }) =>
  `- ${c.category}: $${c.amount.toFixed(2)} (${c.percentage.toFixed(1)}%)`
).join('\n')}

Recent transactions:
${context.recentExpenses.slice(0, 8).map((e: { merchant?: string; category: string; amount: number; date: string }) =>
  `- ${e.merchant || e.category}: $${Number(e.amount).toFixed(2)} on ${e.date}`
).join('\n')}

Active budgets:
${context.budgets.map((b: { category: string; monthly_limit: number }) =>
  `- ${b.category}: $${Number(b.monthly_limit).toFixed(2)} limit`
).join('\n')}

Guidelines:
- Be concise, warm, and encouraging
- Use the actual numbers from the user's data when answering
- If asked to add an expense, extract the amount, merchant, and category and respond with a JSON block: {"action":"add_expense","amount":X,"merchant":"Y","category":"Z","date":"YYYY-MM-DD"}
- For general money questions not covered by the data, give solid financial advice
- Keep responses under 150 words unless a detailed breakdown is requested`

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://moneylens.app',
      'X-Title': 'Money Lens',
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b:free',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: 400,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    return new Response(JSON.stringify({ error: err }), { status: response.status })
  }

  const data = await response.json()
  const reply = data.choices?.[0]?.message?.content ?? 'Sorry, I could not generate a response.'

  return new Response(JSON.stringify({ reply }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
