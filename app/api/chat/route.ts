import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { messages } = await request.json()

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
        {
          role: 'system',
          content: `You are a friendly personal finance assistant built into Budgetly, a budgeting app for Kuwait.
Help users understand their spending, improve budgets, reach savings goals, and make smarter financial decisions.
Currency is KWD (Kuwaiti Dinar) with 3 decimal places. Keep answers concise and actionable.
Do not give investment advice. You can help with budgeting, saving, spending habits, and financial planning.`,
        },
        ...messages,
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    return Response.json({ error: err }, { status: response.status })
  }

  // Pipe the OpenRouter SSE stream straight to the client
  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
