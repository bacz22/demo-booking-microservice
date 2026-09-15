import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  KeyRound,
  Mail,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [countdown, setCountdown] = useState(60)

  // canResend được suy luận trực tiếp từ countdown
  const canResend = countdown === 0

  // Cập nhật tiêu đề trang
  useEffect(() => {
    document.title = 'Quên mật khẩu | CineBook'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Đếm ngược 60 giây để gửi lại email
  useEffect(() => {
    if (!isSubmitted || countdown <= 0) return

    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [isSubmitted, countdown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmed = email.trim()
    if (!trimmed) {
      setEmailError('Vui lòng nhập địa chỉ email của bạn')
      return
    }

    if (!EMAIL_REGEX.test(trimmed)) {
      setEmailError('Địa chỉ email không hợp lệ (ví dụ: name@example.com)')
      return
    }

    setEmailError(undefined)
    setIsLoading(true)

    // Giả lập gửi email khôi phục qua API
    setTimeout(() => {
      setIsLoading(false)
      setIsSubmitted(true)
      setCountdown(60)
      toast.success('Đã gửi email khôi phục mật khẩu!')
    }, 900)
  }

  const handleResend = () => {
    if (!canResend) return
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setCountdown(60)
      toast.success('Đã gửi lại email khôi phục mật khẩu!')
    }, 700)
  }

  return (
    <div className="relative min-h-[calc(100vh-10rem)] flex items-center justify-center py-6 sm:py-10">
      {/* 1. Cinematic Ambient Backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop&q=80"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center opacity-10 dark:opacity-20 transition-opacity"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/95" />
        <div className="absolute inset-0 bg-radial-[at_top_right] from-primary/15 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-radial-[at_bottom_left] from-primary/10 via-transparent to-transparent" />
      </div>

      {/* 2. Container căn giữa */}
      <div className="w-full max-w-md mx-auto px-4">
        {/* Brand Icon & Heading */}
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 mb-1">
            <KeyRound className="h-6 w-6" aria-hidden="true" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            {isSubmitted ? 'Kiểm tra hộp thư' : 'Quên mật khẩu?'}
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
            {isSubmitted
              ? `Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến địa chỉ ${email}`
              : 'Đừng lo lắng! Nhập email tài khoản CineBook để nhận liên kết khôi phục.'}
          </p>
        </div>

        {/* 3. Card Nội Dung Form */}
        <div className="rounded-3xl border border-border/70 bg-card/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {!isSubmitted ? (
            /* TRẠNG THÁI 1: NHẬP EMAIL */
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <FormField
                label="Địa chỉ email"
                id="forgot-email"
                required
                icon={<Mail className="h-4 w-4" />}
                error={emailError}
              >
                <Input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailError) setEmailError(undefined)
                  }}
                  placeholder="name@example.com"
                  error={Boolean(emailError)}
                  className="bg-background/80"
                />
              </FormField>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoading}
                disabled={isLoading}
                className="w-full font-bold shadow-xl shadow-primary/25 cursor-pointer"
              >
                <span>{isLoading ? 'Đang gửi liên kết...' : 'Gửi liên kết khôi phục'}</span>
              </Button>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  <span>Quay lại Đăng nhập</span>
                </Link>
              </div>
            </form>
          ) : (
            /* TRẠNG THÁI 2: ĐÃ GỬI EMAIL THÀNH CÔNG */
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success/15 border border-success/30 text-success shadow-lg shadow-success/10">
                <CheckCircle2 className="h-8 w-8 stroke-[2.2]" />
              </div>

              <div className="rounded-xl border border-border/50 bg-secondary/40 p-4 text-xs text-muted-foreground text-left space-y-2">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>Hướng dẫn tiếp theo:</span>
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Kiểm tra hộp thư đến (và thư mục Spam/Rác).</li>
                  <li>Nhấp vào liên kết trong thư để tạo mật khẩu mới.</li>
                  <li>Liên kết có hiệu lực trong vòng <strong>15 phút</strong>.</li>
                </ul>
              </div>

              {/* Nút gửi lại kèm đếm ngược */}
              <div className="pt-2 space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={handleResend}
                  disabled={!canResend || isLoading}
                  className="w-full text-xs font-semibold border-border/60 hover:bg-secondary cursor-pointer gap-2"
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
                  <span>
                    {canResend
                      ? 'Gửi lại email khôi phục'
                      : `Gửi lại sau (${countdown}s)`}
                  </span>
                </Button>

                <Button asChild variant="primary" size="default" className="w-full font-bold">
                  <Link to="/login">
                    <ArrowLeft className="h-4 w-4 mr-1.5" />
                    <span>Quay lại trang Đăng nhập</span>
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Chân trang trợ giúp */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <span>Gặp khó khăn khi đăng nhập? </span>
          <a
            href="mailto:support@cinebook.vn"
            className="font-semibold text-primary hover:underline"
          >
            Liên hệ hỗ trợ
          </a>
        </div>
      </div>
    </div>
  )
}
