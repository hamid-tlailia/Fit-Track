import type { ComponentPropsWithoutRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-brand-500 to-brand-600 text-[var(--ink-on-brand)] shadow-lg shadow-brand-900/30 hover:brightness-110 active:brightness-95',
  secondary: 'bg-surface-2 text-ink hover:bg-surface-2/70',
  ghost: 'bg-transparent text-ink-soft hover:text-ink hover:bg-surface-2',
}

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: Variant
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...props}
    />
  )
}
