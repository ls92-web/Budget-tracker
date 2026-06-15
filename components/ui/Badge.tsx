import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  color?: string
  className?: string
}

export default function Badge({ children, color, className }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', className)}
      style={color ? {
        background: `${color}20`,
        color: color,
      } : {
        background: 'var(--bg-tertiary)',
        color: 'var(--text-secondary)',
      }}
    >
      {children}
    </span>
  )
}
