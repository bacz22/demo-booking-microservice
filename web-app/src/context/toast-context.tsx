import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { ToastContainer } from '@/components/ui/toast'
import { subscribeToast, subscribeDismiss } from '@/lib/toast'
import type { ToastItem } from '@/types/toast'

const MAX_TOASTS = 3

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    const unsubToast = subscribeToast((newToast) => {
      setToasts((prev) => {
        // Chống spam: Giới hạn tối đa 3 toast hiển thị cùng một lúc
        const updated = [...prev, newToast]
        if (updated.length > MAX_TOASTS) {
          return updated.slice(updated.length - MAX_TOASTS)
        }
        return updated
      })
    })

    const unsubDismiss = subscribeDismiss((id) => {
      dismissToast(id)
    })

    return () => {
      unsubToast()
      unsubDismiss()
    }
  }, [dismissToast])

  return (
    <>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  )
}

export default ToastProvider
