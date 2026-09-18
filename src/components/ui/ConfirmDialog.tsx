interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <button type="button" aria-label={cancelLabel} onClick={onCancel} className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-xs rounded-2xl border border-surface-2 bg-surface p-5 shadow-xl">
        <p className="font-bold">{title}</p>
        <p className="mt-1.5 text-sm text-ink-soft">{message}</p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-surface-2 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-surface-2"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
              danger ? 'bg-red-500 text-white hover:brightness-110' : 'bg-brand-500 text-[var(--ink-on-brand)] hover:brightness-110'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
