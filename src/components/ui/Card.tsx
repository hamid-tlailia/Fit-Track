import type { ComponentPropsWithoutRef } from 'react'

export function Card({ className = '', ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={`rounded-[20px] border border-[var(--line)] bg-surface p-4 shadow-[0_4px_24px_rgba(26,24,22,0.06)] ${className}`}
      {...props}
    />
  )
}
