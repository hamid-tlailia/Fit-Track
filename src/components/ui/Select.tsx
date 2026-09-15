import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectGroup {
  label: string
  options: SelectOption[]
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[] | SelectGroup[]
  placeholder?: string
  className?: string
}

function isGrouped(options: SelectOption[] | SelectGroup[]): options is SelectGroup[] {
  return options.length > 0 && 'options' in options[0]
}

function flatten(options: SelectOption[] | SelectGroup[]): SelectOption[] {
  return isGrouped(options) ? options.flatMap((group) => group.options) : options
}

export function Select({ value, onChange, options, placeholder, className = '' }: SelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = flatten(options).find((option) => option.value === value)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function renderOption(option: SelectOption) {
    const isSelected = option.value === value
    return (
      <button
        key={option.value}
        type="button"
        onClick={() => {
          onChange(option.value)
          setOpen(false)
        }}
        className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-start text-sm transition-colors ${
          isSelected ? 'bg-brand-500/15 text-brand-400 font-semibold' : 'text-ink hover:bg-surface-2'
        }`}
      >
        <span>{option.label}</span>
        {isSelected && <Check size={15} className="shrink-0" />}
      </button>
    )
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-surface-2 bg-surface-2 px-3.5 py-2.5 text-start text-sm text-ink outline-none transition-colors focus:border-brand-500"
      >
        <span className={selected ? '' : 'text-ink-soft'}>{selected?.label ?? placeholder}</span>
        <ChevronDown size={16} className={`shrink-0 text-ink-soft transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 max-h-72 w-full overflow-y-auto rounded-xl border border-surface-2 bg-surface p-1.5 shadow-2xl shadow-black/40">
          {isGrouped(options)
            ? options.map((group) => (
                <div key={group.label} className="mb-1 last:mb-0">
                  <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-ink-soft">
                    {group.label}
                  </p>
                  {group.options.map(renderOption)}
                </div>
              ))
            : options.map(renderOption)}
        </div>
      )}
    </div>
  )
}
