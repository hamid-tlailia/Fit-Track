import type { ComponentPropsWithoutRef } from 'react'

export function Card({ className = '', ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={`rounded-2xl border border-surface-2 bg-surface p-4 ${className}`}
      {...props}
    />
  )
}
