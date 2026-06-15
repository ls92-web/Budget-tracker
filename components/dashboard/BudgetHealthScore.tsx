'use client'

interface BudgetHealthScoreProps {
  score: number
}

export default function BudgetHealthScore({ score }: BudgetHealthScoreProps) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Attention'
  const circumference = 2 * Math.PI * 36
  const dash = (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
          <circle
            cx="44" cy="44" r="36"
            fill="none"
            stroke="var(--bg-tertiary)"
            strokeWidth="6"
          />
          <circle
            cx="44" cy="44" r="36"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold font-mono" style={{ color }}>{score}</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/ 100</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold" style={{ color }}>{label}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Budget Health</p>
      </div>
    </div>
  )
}
