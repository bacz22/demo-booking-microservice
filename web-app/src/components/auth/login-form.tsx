import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { Alert } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import type { LoginFormData } from '@/types/auth'

export interface LoginFormProps {
  /** Callback khi submit form đăng nhập */
  onSubmit?: (data: LoginFormData) => void | Promise<void>
  /** Giá trị email mặc định */
  defaultEmail?: string
  /** Giá trị mật khẩu mặc định (dùng cho tài khoản trải nghiệm demo) */
  defaultPassword?: string
  /** Trạng thái ghi nhớ mặc định */
  defaultRemember?: boolean
  /** Trạng thái loading từ bên ngoài */
  loading?: boolean
  /** Lỗi toàn form (ví dụ từ backend hoặc mock xác thực) */
  formError?: string | null
  className?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function LoginForm({
  onSubmit,
  defaultEmail = '',
  defaultPassword = '',
  defaultRemember = true,
  loading = false,
  formError: externalFormError,
  className,
}: LoginFormProps) {
  const [email, setEmail] = useState(defaultEmail)
  const [password, setPassword] = useState(defaultPassword)
  const [rememberMe, setRememberMe] = useState(defaultRemember)
  const [showPassword, setShowPassword] = useState(false)

  // Quản lý lỗi từng trường (field error)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  // Quản lý lỗi toàn form (form error)
  const [internalFormError, setInternalFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const effectiveFormError = externalFormError ?? internalFormError
  const isBusy = loading || isSubmitting

  // Kiểm tra tính hợp lệ của từng trường
  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {}
    let isValid = true

    // Kiểm tra email
    if (!email.trim()) {
      errors.email = 'Vui lòng nhập địa chỉ email'
      isValid = false
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = 'Email không hợp lệ (ví dụ: name@example.com)'
      isValid = false
    }

    // Kiểm tra password
    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu'
      isValid = false
    } else if (password.length < 6) {
      errors.password = 'Mật khẩu phải chứa ít nhất 6 ký tự'
      isValid = false
    }

    setFieldErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setInternalFormError(null)

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      if (onSubmit) {
        await onSubmit({
          email: email.trim(),
          password,
          rememberMe,
        })
      } else {
        // Giả lập xử lý đăng nhập 800ms khi chưa có handler ngoài
        await new Promise((resolve) => setTimeout(resolve, 800))
      }
    } catch (err) {
      setInternalFormError(
        err instanceof Error ? err.message : 'Email hoặc mật khẩu không chính xác. Vui lòng thử lại.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn(
        'w-full rounded-2xl sm:rounded-3xl border border-border/60 bg-card/85 p-6 sm:p-8 md:p-10 shadow-2xl backdrop-blur-md space-y-6',
        className
      )}
    >
      {/* 1. Thông báo lỗi toàn form (Form Error State) */}
      {effectiveFormError && (
        <Alert variant="destructive">
          {effectiveFormError}
        </Alert>
      )}

      {/* 2. Trường Email */}
      <FormField
        id="login-email"
        label="Địa chỉ Email"
        icon={<Mail className="h-4 w-4" />}
        error={fieldErrors.email}
      >
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          disabled={isBusy}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (fieldErrors.email) {
              setFieldErrors((prev) => ({ ...prev, email: undefined }))
            }
          }}
          placeholder="name@example.com"
          error={Boolean(fieldErrors.email)}
        />
      </FormField>

      {/* 3. Trường Mật khẩu (Có Show/Hide Password) */}
      <FormField
        id="login-password"
        label="Mật khẩu"
        icon={<Lock className="h-4 w-4" />}
        error={fieldErrors.password}
      >
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            disabled={isBusy}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (fieldErrors.password) {
                setFieldErrors((prev) => ({ ...prev, password: undefined }))
              }
            }}
            placeholder="Nhập mật khẩu của bạn"
            error={Boolean(fieldErrors.password)}
            className="pr-12"
          />

          {/* Nút bật/tắt hiển thị mật khẩu (Show/Hide Password) */}
          <button
            type="button"
            disabled={isBusy}
            onClick={() => setShowPassword((prev) => !prev)}
            title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </FormField>

      {/* 4. Remember me & Forgot password */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
        <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors">
          <Input
            type="checkbox"
            disabled={isBusy}
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <span>Ghi nhớ đăng nhập</span>
        </label>

        <Link
          to="/forgot-password"
          className="font-medium text-primary hover:underline hover:text-primary/90 transition-colors"
        >
          Quên mật khẩu?
        </Link>
      </div>

      {/* 5. Nút Submit đăng nhập (Loading State) */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={isBusy}
        disabled={isBusy}
        className="w-full font-bold shadow-xl shadow-primary/25 transition-transform hover:scale-[1.01] active:scale-[0.99]"
      >
        <LogIn className="h-4 w-4 mr-2" aria-hidden="true" />
        <span>{isBusy ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
      </Button>

      {/* 6. Register link */}
      <div className="text-center pt-2 text-xs sm:text-sm text-muted-foreground">
        <span>Chưa có tài khoản CineBook? </span>
        <Link
          to="/register"
          className="font-bold text-primary hover:underline hover:text-primary/90 transition-colors"
        >
          Đăng ký ngay
        </Link>
      </div>
    </form>
  )
}

export default LoginForm
