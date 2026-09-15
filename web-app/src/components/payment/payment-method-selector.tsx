import { useRef, useCallback } from 'react'
import { QrCode, Wallet, CreditCard, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PaymentMethodId, PaymentMethodOption } from '@/types/payment'

export interface PaymentMethodSelectorProps {
  /** Phương thức thanh toán đang được chọn */
  value: PaymentMethodId
  /** Callback khi người dùng chọn phương thức thanh toán mới */
  onChange: (method: PaymentMethodId) => void
  /** Vô hiệu hóa bộ chọn */
  disabled?: boolean
  className?: string
}

const PAYMENT_METHODS: (PaymentMethodOption & {
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
})[] = [
  {
    id: 'vnpay',
    title: 'VNPay (VNPAY-QR)',
    subtitle: 'Quét mã QR qua ứng dụng ngân hàng hoặc ví VNPAY',
    badge: 'Phổ biến',
    icon: QrCode,
    iconBg: 'bg-blue-600/15 border-blue-500/30',
    iconColor: 'text-blue-500',
  },
  {
    id: 'momo',
    title: 'Ví MoMo',
    subtitle: 'Thanh toán siêu tốc qua ứng dụng Ví điện tử MoMo',
    badge: 'Nhanh chóng',
    icon: Wallet,
    iconBg: 'bg-pink-600/15 border-pink-500/30',
    iconColor: 'text-pink-500',
  },
  {
    id: 'card',
    title: 'Thẻ Quốc Tế (Credit / Debit Card)',
    subtitle: 'Hỗ trợ thẻ thanh toán Visa, MasterCard, JCB',
    icon: CreditCard,
    iconBg: 'bg-amber-600/15 border-amber-500/30',
    iconColor: 'text-amber-500',
  },
]

export function PaymentMethodSelector({
  value,
  onChange,
  disabled = false,
  className,
}: PaymentMethodSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Điều hướng bằng bàn phím theo chuẩn WAI-ARIA Radio Group
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      if (disabled) return

      let nextIndex = currentIndex

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        nextIndex = (currentIndex + 1) % PAYMENT_METHODS.length
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        nextIndex = (currentIndex - 1 + PAYMENT_METHODS.length) % PAYMENT_METHODS.length
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        onChange(PAYMENT_METHODS[currentIndex].id)
        return
      } else {
        return
      }

      onChange(PAYMENT_METHODS[nextIndex].id)

      // Chuyển focus sang nút mới
      const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
      buttons?.[nextIndex]?.focus()
    },
    [disabled, onChange]
  )

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label="Phương thức thanh toán"
      className={cn('space-y-3 w-full select-none', className)}
    >
      {PAYMENT_METHODS.map((method, index) => {
        const isSelected = value === method.id
        const IconComponent = method.icon

        return (
          <button
            key={method.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-disabled={disabled}
            disabled={disabled}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => !disabled && onChange(method.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'group relative flex w-full items-center gap-3.5 sm:gap-4 rounded-2xl border p-4 text-left transition-all duration-200 outline-hidden',
              'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              // 1. Trạng thái Selected (Đang chọn)
              isSelected && [
                'border-primary bg-primary/8 shadow-md shadow-primary/10 ring-1 ring-primary/40',
              ],
              // 2. Trạng thái Disabled (Vô hiệu hóa)
              disabled && [
                'opacity-40 cursor-not-allowed pointer-events-none bg-muted/20 border-border/30',
              ],
              // 3. Trạng thái Default (Bình thường)
              !isSelected &&
                !disabled && [
                  'border-border/60 bg-card/75 hover:bg-secondary/80 hover:border-border cursor-pointer hover:shadow-sm',
                ]
            )}
          >
            {/* Custom Radio Button Indicator */}
            <div
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                  : 'border-muted-foreground/40 bg-transparent group-hover:border-muted-foreground'
              )}
              aria-hidden="true"
            >
              {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
            </div>

            {/* Icon đại diện thương hiệu */}
            <div
              className={cn(
                'flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border transition-transform group-hover:scale-105',
                method.iconBg,
                method.iconColor
              )}
              aria-hidden="true"
            >
              <IconComponent className="h-5 w-5" />
            </div>

            {/* Nội dung tiêu đề & mô tả */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'font-bold text-sm sm:text-base tracking-tight transition-colors',
                    isSelected
                      ? 'text-foreground'
                      : 'text-foreground/90 group-hover:text-foreground'
                  )}
                >
                  {method.title}
                </span>

                {method.badge && (
                  <span className="hidden sm:inline-flex items-center rounded-md bg-secondary border border-border/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {method.badge}
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                {method.subtitle}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default PaymentMethodSelector
