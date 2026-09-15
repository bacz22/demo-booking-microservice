import { useEffect, useRef } from 'react'
import { AlertTriangle, Archive, Trash2, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AdminConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string
  targetName?: string
  consequenceWarning?: string
  confirmText?: string
  cancelText?: string
  variant?: 'destructive' | 'warning' | 'default'
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function AdminConfirmDialog({
  isOpen,
  title,
  description,
  targetName,
  consequenceWarning,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  variant = 'warning',
  isLoading = false,
  onConfirm,
  onCancel,
}: AdminConfirmDialogProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null)

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    // Focus confirm button when opened
    const timer = setTimeout(() => {
      confirmBtnRef.current?.focus()
    }, 50)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      clearTimeout(timer)
    }
  }, [isOpen, isLoading, onCancel])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      {/* Backdrop Scrim */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={() => {
          if (!isLoading) onCancel()
        }}
        aria-hidden="true"
      />

      {/* Modal Dialog Box */}
      <div className="relative w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-150 space-y-4">
        {/* Header Icon & Close Button */}
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center border shrink-0',
              variant === 'destructive'
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
            )}
          >
            {variant === 'destructive' ? (
              <Trash2 className="w-5 h-5" />
            ) : (
              <Archive className="w-5 h-5" />
            )}
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            aria-label="Đóng hộp thoại"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5 text-left">
          <h3
            id="confirm-dialog-title"
            className="text-base sm:text-lg font-heading font-black tracking-tight text-foreground"
          >
            {title}
          </h3>

          {targetName && (
            <div className="inline-block px-2.5 py-1 rounded-lg bg-secondary text-xs font-bold text-foreground font-mono truncate max-w-full">
              {targetName}
            </div>
          )}

          <p id="confirm-dialog-desc" className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        {/* Warning Callout */}
        {consequenceWarning && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{consequenceWarning}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-xl text-xs cursor-pointer"
          >
            {cancelText}
          </Button>

          <Button
            ref={confirmBtnRef}
            type="button"
            variant={variant === 'destructive' ? 'destructive' : 'primary'}
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-xl text-xs gap-1.5 cursor-pointer font-bold"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AdminConfirmDialog
