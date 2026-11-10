import { CreditCard, Loader2, ShieldCheck, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'

interface MockGatewayDialogProps {
  isOpen: boolean
  paymentCode?: string
  amount: number
  isSubmitting: boolean
  onApprove: () => void
  onDecline: () => void
}

/**
 * Cổng thanh toán giả lập (payment-service đang dùng phương thức MOCK).
 * Cho phép chọn kết quả giao dịch để kiểm thử cả luồng thành công lẫn thất bại.
 * Không đóng bằng Esc/click nền để tránh vô tình "từ chối" giao dịch.
 */
export function MockGatewayDialog({
  isOpen,
  paymentCode,
  amount,
  isSubmitting,
  onApprove,
  onDecline,
}: MockGatewayDialogProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mock-gateway-title"
    >
      <div className="fixed inset-0 bg-background/80 backdrop-blur-md" aria-hidden="true" />
      <div className="relative w-full max-w-md space-y-5 rounded-2xl border border-border/80 bg-card/95 p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h3 id="mock-gateway-title" className="text-lg font-bold text-foreground">
              Cổng thanh toán giả lập
            </h3>
            <p className="text-xs text-muted-foreground">Môi trường thử nghiệm – không trừ tiền thật</p>
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-border/60 bg-secondary/30 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mã giao dịch</span>
            <span className="font-mono font-semibold text-foreground">{paymentCode ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Số tiền</span>
            <span className="font-bold text-primary">{formatPrice(amount)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            onClick={onDecline}
            disabled={isSubmitting}
            className="gap-1.5 rounded-xl hover:border-destructive/50 hover:text-destructive"
          >
            <XCircle className="h-4 w-4" />
            Từ chối giao dịch
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onApprove}
            disabled={isSubmitting}
            className="gap-1.5 rounded-xl font-bold"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Thanh toán thành công
          </Button>
        </div>
      </div>
    </div>
  )
}

export default MockGatewayDialog
