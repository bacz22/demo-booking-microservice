import { Link } from 'react-router-dom'
import { AlertCircle, RotateCcw, Home } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface PageErrorStateProps {
  /** Tiêu đề lỗi hiển thị cho người dùng */
  title?: string
  /** Nội dung thông điệp lỗi thân thiện (Tuyệt đối không expose stack trace hay chi tiết kỹ thuật) */
  message?: string
  /** Nhãn nút bấm thử lại */
  retryLabel?: string
  /** Callback xử lý khi người dùng nhấn nút thử lại */
  onRetry?: () => void
  /** Tùy chọn icon thay thế */
  icon?: LucideIcon
  /** Nhãn nút về trang chủ */
  homeLabel?: string
  /** Hiển thị thêm nút điều hướng về trang chủ */
  showHomeButton?: boolean
  className?: string
}

/**
 * Hàm lọc và chuẩn hóa thông điệp lỗi nhằm đảm bảo an toàn tuyệt đối
 * Không bao giờ làm lộ stack trace, path hệ thống hoặc chi tiết nhạy cảm
 */
function sanitizeErrorMessage(rawMessage?: string): string {
  if (!rawMessage) {
    return 'Hệ thống gặp sự cố trong quá trình xử lý yêu cầu. Vui lòng thử lại sau giây lát hoặc quay về trang chủ.'
  }

  // Nếu chuỗi chứa dấu hiệu của JavaScript stack trace hoặc traceback hệ thống
  if (
    rawMessage.includes('\n') ||
    rawMessage.includes('at ') ||
    rawMessage.includes('TypeError:') ||
    rawMessage.includes('ReferenceError:') ||
    rawMessage.includes('SyntaxError:') ||
    rawMessage.includes('Error:') ||
    rawMessage.includes('C:\\') ||
    rawMessage.includes('/node_modules/')
  ) {
    return 'Đã xảy ra sự cố kỹ thuật không mong muốn. Vui lòng thử lại sau hoặc liên hệ bộ phận hỗ trợ nếu sự cố tiếp tục diễn ra.'
  }

  return rawMessage
}

export function PageErrorState({
  title = 'Đã xảy ra lỗi không mong muốn',
  message,
  retryLabel = 'Thử lại',
  onRetry,
  icon: Icon = AlertCircle,
  homeLabel = 'Về trang chủ',
  showHomeButton = true,
  className,
}: PageErrorStateProps) {
  const safeMessage = sanitizeErrorMessage(message)

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'flex min-h-[400px] w-full flex-col items-center justify-center p-6 sm:p-10 text-center animate-in fade-in-50 select-none',
        className
      )}
    >
      {/* 1. Error Icon Container */}
      <div
        className="mb-5 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl border border-destructive/30 bg-destructive/15 text-destructive shadow-lg shadow-destructive/10"
        aria-hidden="true"
      >
        <Icon className="h-8 w-8 sm:h-10 sm:w-10 stroke-[2.2]" />
      </div>

      {/* 2. Tiêu đề lỗi (Title) */}
      <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground max-w-md">
        {title}
      </h2>

      {/* 3. Thông điệp lỗi thân thiện (Không bao giờ expose stack trace) */}
      <p className="mt-2.5 max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed">
        {safeMessage}
      </p>

      {/* 4. Nhóm nút hành động: Thử lại (onRetry) & Về trang chủ (Home) */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button
            type="button"
            variant="primary"
            size="default"
            onClick={onRetry}
            className="gap-2 font-bold shadow-lg shadow-primary/25 cursor-pointer active:scale-95"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>{retryLabel}</span>
          </Button>
        )}

        {showHomeButton && (
          <Button
            asChild
            variant="outline"
            size="default"
            className="gap-2 border-border/70 hover:bg-secondary cursor-pointer active:scale-95"
          >
            <Link to="/">
              <Home className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span>{homeLabel}</span>
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}

export default PageErrorState
