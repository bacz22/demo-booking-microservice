import { useState, useEffect, useRef } from 'react'
import { Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SeatHoldCountdownProps {
  /** Thời điểm hết hạn giữ ghế (Timestamp ms, chuỗi ISO hoặc đối tượng Date) */
  expiresAt: number | string | Date
  /** Callback tuỳ chọn khi đếm ngược về 0 */
  onExpire?: () => void
  className?: string
}

function getExpiresAtMs(expiresAt: number | string | Date): number {
  if (typeof expiresAt === 'number') {
    return expiresAt
  }
  if (typeof expiresAt === 'string') {
    return new Date(expiresAt).getTime()
  }
  return expiresAt.getTime()
}

export function SeatHoldCountdown({
  expiresAt,
  onExpire,
  className,
}: SeatHoldCountdownProps) {
  const onExpireRef = useRef(onExpire)

  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    const target = getExpiresAtMs(expiresAt)
    return Math.max(0, Math.floor((target - Date.now()) / 1000))
  })

  // Quản lý thông báo cho Screen Reader (chỉ thông báo mốc quan trọng, tránh spam mỗi giây)
  const [srAnnouncement, setSrAnnouncement] = useState<string>(() => {
    const target = getExpiresAtMs(expiresAt)
    const initial = Math.max(0, Math.floor((target - Date.now()) / 1000))
    const initialMinutes = Math.ceil(initial / 60)
    return `Thời gian giữ ghế còn khoảng ${initialMinutes} phút.`
  })

  const hasAnnouncedWarningRef = useRef(false)
  const hasAnnouncedExpiredRef = useRef(false)

  useEffect(() => {
    const target = getExpiresAtMs(expiresAt)

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((target - Date.now()) / 1000))
      setSecondsLeft(remaining)

      // Cảnh báo mốc dưới 60 giây cho Screen Reader (chỉ thông báo 1 lần)
      if (remaining < 60 && remaining > 0 && !hasAnnouncedWarningRef.current) {
        hasAnnouncedWarningRef.current = true
        setSrAnnouncement('Cảnh báo: Thời gian giữ ghế còn dưới 1 phút.')
      }

      // Thông báo hết hạn (chỉ 1 lần)
      if (remaining <= 0) {
        clearInterval(interval)
        if (!hasAnnouncedExpiredRef.current) {
          hasAnnouncedExpiredRef.current = true
          setSrAnnouncement('Thời gian giữ ghế đã hết.')
          onExpireRef.current?.()
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt])

  const isExpired = secondsLeft <= 0
  const isWarning = secondsLeft > 0 && secondsLeft < 60

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <div
      role="timer"
      aria-label={`Thời gian giữ ghế còn ${minutes} phút ${seconds} giây`}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 backdrop-blur-sm select-none',
        // 1. Trạng thái hết hạn (Expired)
        isExpired &&
          'border-destructive/50 bg-destructive/10 text-destructive shadow-xs',
        // 2. Trạng thái cảnh báo dưới 60 giây (Warning)
        isWarning &&
          'border-amber-500/50 bg-amber-500/10 text-amber-500 shadow-xs animate-pulse',
        // 3. Trạng thái đếm ngược thông thường
        !isExpired &&
          !isWarning &&
          'border-border/60 bg-card/85 text-foreground shadow-xs',
        className
      )}
    >
      {/* Icon trạng thái */}
      {isExpired ? (
        <AlertCircle className="h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
      ) : isWarning ? (
        <Clock className="h-4 w-4 shrink-0 text-amber-500 animate-pulse" aria-hidden="true" />
      ) : (
        <Clock className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      )}

      {/* Hiển thị trực quan: Thời gian giữ ghế: 04:59 */}
      <span aria-hidden="true" className="tracking-tight">
        Thời gian giữ ghế:{' '}
        <span className="font-mono font-bold tracking-wider">
          {isExpired ? '00:00' : formattedTime}
        </span>
      </span>

      {/* Vùng thông báo tiếp cận cho Screen Reader (WCAG AA - chỉ thông báo theo mốc, KHÔNG spam mỗi giây) */}
      <span role="status" aria-live="polite" className="sr-only">
        {srAnnouncement}
      </span>
    </div>
  )
}

export default SeatHoldCountdown
