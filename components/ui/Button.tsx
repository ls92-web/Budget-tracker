import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-bold transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'text-white rounded-full',
    secondary: 'rounded-xl',
    ghost: 'rounded-xl',
    danger: 'text-white rounded-xl',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-sm',
  }

  const styles: React.CSSProperties =
    variant === 'primary'
      ? { background: 'linear-gradient(135deg,#ec4899,#db2777)', boxShadow: '0 5px 16px rgba(236,72,153,0.42)' }
      : variant === 'danger'
      ? { background: 'var(--danger)', color: '#fff' }
      : variant === 'secondary'
      ? { background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }
      : { background: 'transparent', color: 'var(--text-secondary)' }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      style={styles}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}
