import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Armchair,
  CreditCard,
  WifiOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ToastItem, ToastType } from '@/types/toast'

export interface ToastProps {
  toast: ToastItem
  onDismiss: (id: string) => void
}

function getToastIcon(type: ToastType, title?: string) {
  const t = title?.toLowerCase() || ''
  if (t.includes('ghế')) {
    return <Armchair className="h-5 w-5 text-amber-500 shrink-0" aria-hidden="true" />
  }
  if (t.includes('thanh toán')) {
    return <CreditCard className="h-5 w-5 text-destructive shrink-0" aria-hidden="true" />
  }
  if (t.includes('máy chủ') || t.includes('kết nối') || t.includes('mạng')) {
    return <WifiOff className="h-5 w-5 text-destructive shrink-0" aria-hidden="true" />
  }

  switch (type) {
    case 'success':
      return <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" aria-hidden="true" />
    case 'error':
      return <AlertCircle className="h-5 w-5 text-destructive shrink-0" aria-hidden="true" />
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" aria-hidden="true" />
    case 'info':
    default:
      return <Info className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
  }
}

function getToastBorder(type: ToastType) {
  switch (type) {
    case 'success':
      return 'border-emerald-500/40 shadow-emerald-500/10'
    case 'error':
      return 'border-destructive/40 shadow-destructive/10'
    case 'warning':
      return 'border-amber-500/40 shadow-amber-500/10'
    case 'info':
    default:
      return 'border-primary/40 shadow-primary/10'
  }
}

export function ToastCard({ toast, onDismiss }: ToastProps) {
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) return
    const duration = toast.duration ?? 4000
    if (duration <= 0) return

    const timer = setTimeout(() => {
      onDismiss(toast.id)
    }, duration)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, isPaused, onDismiss])

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={cn(
        'group pointer-events-auto relative flex w-full max-w-sm items-start gap-3.5 rounded-2xl border bg-card/95 p-4 text-foreground shadow-2xl backdrop-blur-md transition-all select-none',
        'animate-in fade-in-50 slide-in-from-top-3 sm:slide-in-from-bottom-3 duration-200',
        getToastBorder(toast.type)
      )}
    >
      {/* Icon theo ngữ cảnh */}
      <div className="mt-0.5 shrink-0">{getToastIcon(toast.type, toast.title)}</div>

      {/* Nội dung Toast */}
      <div className="flex-1 space-y-1 pr-2">
        {toast.title && (
          <h4 className="text-xs sm:text-sm font-bold tracking-tight text-foreground leading-snug">
            {toast.title}
          </h4>
        )}
        <div className="text-xs text-muted-foreground leading-relaxed break-words">
          {toast.description}
        </div>
      </div>

      {/* Nút đóng Toast */}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Đóng thông báo"
        className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div
      aria-label="Khu vực thông báo"
      className="pointer-events-none fixed z-100 flex flex-col gap-2.5 max-w-sm w-full p-4 top-4 right-4 sm:top-auto sm:bottom-4 sm:right-4"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

export default ToastContainer
