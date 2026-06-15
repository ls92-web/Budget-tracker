import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full rounded-xl text-sm transition-all duration-150 outline-none',
              icon ? 'pl-9 pr-3 py-2.5' : 'px-3 py-2.5',
              className
            )}
            style={{
              background: 'var(--bg-tertiary)',
              border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
            }}
            {...props}
          />
        </div>
        {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}
        {hint && !error && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
