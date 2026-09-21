import type { ComponentPropsWithoutRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-brand-500 text-white shadow-[0_4px_16px_rgba(255,107,45,0.28)] hover:bg-brand-600 active:bg-brand-700 border border-brand-500',
  secondary: 'bg-surface border border-[var(--line)] text-ink hover:bg-surface-2',
  ghost: 'bg-transparent text-ink-soft hover:text-ink hover:bg-surface-2 border border-transparent',
}

const spinnerClasses: Record<Variant, string> = {
  primary: 'border-white/30 border-t-white',
  secondary: 'border-ink/30 border-t-ink',
  ghost: 'border-ink-soft/30 border-t-ink-soft',
}

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: Variant
  loading?: boolean
}

export function Button({ variant = 'primary', loading = false, className = '', disabled, children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <span className={`h-4 w-4 rounded-full border-2 animate-spin ${spinnerClasses[variant]}`} />
      )}
      {children}
    </button>
  )
}
