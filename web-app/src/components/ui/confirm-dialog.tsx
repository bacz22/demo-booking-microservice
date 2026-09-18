import * as React from 'react'
import { AlertTriangle, AlertCircle, Info, Trash2, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ConfirmDialogProps {
  /** Trạng thái mở/đóng của dialog */
  isOpen: boolean
  /** Tiêu đề của dialog */
  title: string
  /** Nội dung mô tả chi tiết */
  description: string
  /** Thông tin ghi chú cảnh báo nổi bật (nếu có) */
  warningNote?: string
  /** Nhãn nút xác nhận (mặc định: 'Xác nhận') */
  confirmText?: string
  /** Nhãn nút hủy (mặc định: 'Hủy bỏ') */
  cancelText?: string
  /** Kiểu biến thể: destructive (đỏ), warning (vàng cam), info (xanh), default */
  variant?: 'destructive' | 'warning' | 'info' | 'default'
  /** Tuỳ chỉnh icon hiển thị */
  icon?: React.ReactNode
  /** Trạng thái đang xử lý (loading) */
  isLoading?: boolean
  /** Callback khi nhấn xác nhận */
  onConfirm: () => void
  /** Callback khi nhấn hủy bỏ hoặc đóng dialog */
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  warningNote,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  variant = 'destructive',
  icon,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmBtnRef = React.useRef<HTMLButtonElement>(null)

  // Bắt sự kiện phím Escape & khóa cuộn trang
  React.useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const timer = setTimeout(() => {
      confirmBtnRef.current?.focus()
    }, 60)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
      clearTimeout(timer)
    }
  }, [isOpen, isLoading, onCancel])

  if (!isOpen) return null

  const renderDefaultIcon = () => {
    switch (variant) {
      case 'destructive':
        return <Trash2 className="w-5 h-5 text-rose-500 dark:text-rose-400" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400" />
      case 'info':
        return <Info className="w-5 h-5 text-sky-500 dark:text-sky-400" />
      default:
        return <AlertCircle className="w-5 h-5 text-primary" />
    }
  }

  const iconBgClasses = {
    destructive: 'bg-rose-500/10 border-rose-500/20 text-rose-500',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
    info: 'bg-sky-500/10 border-sky-500/20 text-sky-500',
    default: 'bg-primary/10 border-primary/20 text-primary',
  }[variant]

  const confirmVariant = variant === 'destructive' ? 'destructive' : 'primary'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      {/* Backdrop mờ tối */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-md transition-opacity duration-200 animate-in fade-in"
        onClick={() => {
          if (!isLoading) onCancel()
        }}
        aria-hidden="true"
      />

      {/* Hộp thoại Dialog chính */}
      <div className="relative w-full max-w-md rounded-2xl border border-border/80 bg-card/95 p-6 shadow-2xl backdrop-blur-2xl transition-all animate-in zoom-in-95 duration-150 space-y-4">
        {/* Header: Icon & Nút đóng X */}
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center border shrink-0',
              iconBgClasses
            )}
          >
            {icon ?? renderDefaultIcon()}
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer disabled:opacity-40"
            aria-label="Đóng hộp thoại"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tiêu đề và Mô tả */}
        <div className="space-y-2 text-left">
          <h3
            id="confirm-dialog-title"
            className="text-lg font-bold tracking-tight text-foreground"
          >
            {title}
          </h3>

          <p id="confirm-dialog-desc" className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        {/* Khung chú ý/cảnh báo (Warning Note) */}
        {warningNote && (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{warningNote}</span>
          </div>
        )}

        {/* Nút hành động */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-xl text-xs sm:text-sm font-medium px-4 cursor-pointer"
          >
            {cancelText}
          </Button>

          <Button
            ref={confirmBtnRef}
            type="button"
            variant={confirmVariant}
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-xl text-xs sm:text-sm font-bold px-4 gap-1.5 cursor-pointer shadow-md"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
