'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface CategoryPieChartProps {
  data: Array<{ category: string; amount: number; color: string; percentage: number }>
}

export default function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No expenses this month</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row items-center gap-4">
      <ResponsiveContainer width={160} height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={72}
            paddingAngle={2}
            dataKey="amount"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              fontSize: '12px',
            }}
            formatter={(value) => [formatCurrency(Number(value))]}
            labelFormatter={(_, payload) => payload[0]?.payload?.category || ''}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex-1 space-y-2 w-full">
        {data.slice(0, 5).map((item) => (
          <div key={item.category} className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
            <span className="text-xs flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
              {item.category}
            </span>
            <span className="text-xs font-medium font-mono" style={{ color: 'var(--text-primary)' }}>
              {item.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
