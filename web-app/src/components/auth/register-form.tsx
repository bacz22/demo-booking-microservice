import { useState } from 'react'
import { Link } from 'react-router-dom'
import { User, Mail, Lock, Eye, EyeOff, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { Alert } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import type { RegisterFormData } from '@/types/auth'

export interface RegisterFormProps {
  /** Callback khi submit form đăng ký thành công */
  onSubmit?: (data: RegisterFormData) => void | Promise<void>
  /** Giá trị mặc định */
  defaultValues?: Partial<RegisterFormData>
  /** Trạng thái loading từ bên ngoài */
  loading?: boolean
  /** Lỗi toàn form (ví dụ từ backend hoặc mock xác thực) */
  formError?: string | null
  className?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function RegisterForm({
  onSubmit,
  defaultValues,
  loading = false,
  formError: externalFormError,
  className,
}: RegisterFormProps) {
  const [fullName, setFullName] = useState(defaultValues?.fullName || '')
  const [email, setEmail] = useState(defaultValues?.email || '')
  const [password, setPassword] = useState(defaultValues?.password || '')
  const [confirmPassword, setConfirmPassword] = useState(defaultValues?.confirmPassword || '')
  const [agreeTerms, setAgreeTerms] = useState(defaultValues?.agreeTerms ?? true)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Quản lý lỗi từng trường (Field Errors)
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string
    email?: string
    password?: string
    confirmPassword?: string
    agreeTerms?: string
  }>({})

  // Quản lý lỗi toàn form (Form Error)
  const [internalFormError, setInternalFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const effectiveFormError = externalFormError ?? internalFormError
  const isBusy = loading || isSubmitting

  // Kiểm tra tính hợp lệ toàn diện theo đặc tả Task 36
  const validate = (): boolean => {
    const errors: typeof fieldErrors = {}
    let isValid = true

    // 1. Kiểm tra Họ và tên (Required)
    if (!fullName.trim()) {
      errors.fullName = 'Vui lòng nhập họ và tên của bạn'
      isValid = false
    }

    // 2. Kiểm tra Email (Required & Invalid email)
    if (!email.trim()) {
      errors.email = 'Vui lòng nhập địa chỉ email'
      isValid = false
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = 'Email không hợp lệ (ví dụ: name@example.com)'
      isValid = false
    }

    // 3. Kiểm tra Password (Required & Password too short)
    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu'
      isValid = false
    } else if (password.length < 6) {
      errors.password = 'Mật khẩu phải chứa ít nhất 6 ký tự'
      isValid = false
    }

    // 4. Kiểm tra Confirm Password (Required & Password mismatch)
    if (!confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận lại mật khẩu'
      isValid = false
    } else if (confirmPassword !== password) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp'
      isValid = false
    }

    // 5. Kiểm tra đồng ý điều khoản
    if (!agreeTerms) {
      errors.agreeTerms = 'Bạn cần đồng ý với Điều khoản dịch vụ để tiếp tục'
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
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          confirmPassword,
          agreeTerms,
        })
      } else {
        // Giả lập đăng ký trong 800ms khi chưa có handler ngoài
        await new Promise((resolve) => setTimeout(resolve, 800))
      }
    } catch (err) {
      setInternalFormError(
        err instanceof Error ? err.message : 'Đăng ký không thành công. Vui lòng thử lại.'
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
        'w-full rounded-2xl sm:rounded-3xl border border-border/60 bg-card/85 p-6 sm:p-8 md:p-10 shadow-2xl backdrop-blur-md space-y-5',
        className
      )}
    >
      {/* Thông báo lỗi toàn form */}
      {effectiveFormError && (
        <Alert variant="destructive">
          {effectiveFormError}
        </Alert>
      )}

      {/* 1. Trường Họ và tên (fullName) */}
      <FormField
        id="register-fullname"
        label="Họ và tên"
        icon={<User className="h-4 w-4" />}
        error={fieldErrors.fullName}
      >
        <Input
          id="register-fullname"
          type="text"
          autoComplete="name"
          disabled={isBusy}
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value)
            if (fieldErrors.fullName) {
              setFieldErrors((prev) => ({ ...prev, fullName: undefined }))
            }
          }}
          placeholder="Nguyễn Văn A"
          error={Boolean(fieldErrors.fullName)}
        />
      </FormField>

      {/* 2. Trường Email (email) */}
      <FormField
        id="register-email"
        label="Địa chỉ Email"
        icon={<Mail className="h-4 w-4" />}
        error={fieldErrors.email}
      >
        <Input
          id="register-email"
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

      {/* 3. Trường Mật khẩu (password) */}
      <FormField
        id="register-password"
        label="Mật khẩu"
        icon={<Lock className="h-4 w-4" />}
        error={fieldErrors.password}
      >
        <div className="relative">
          <Input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            disabled={isBusy}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (fieldErrors.password) {
                setFieldErrors((prev) => ({ ...prev, password: undefined }))
              }
            }}
            placeholder="Tối thiểu 6 ký tự"
            error={Boolean(fieldErrors.password)}
            className="pr-12"
          />

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

      {/* 4. Trường Xác nhận Mật khẩu (confirmPassword) */}
      <FormField
        id="register-confirm-password"
        label="Xác nhận mật khẩu"
        icon={<Lock className="h-4 w-4" />}
        error={fieldErrors.confirmPassword}
      >
        <div className="relative">
          <Input
            id="register-confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            disabled={isBusy}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              if (fieldErrors.confirmPassword) {
                setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }))
              }
            }}
            placeholder="Nhập lại mật khẩu"
            error={Boolean(fieldErrors.confirmPassword)}
            className="pr-12"
          />

          <button
            type="button"
            disabled={isBusy}
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </FormField>

      {/* Điều khoản dịch vụ */}
      <div className="space-y-1 pt-1">
        <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-muted-foreground leading-relaxed">
          <Input
            type="checkbox"
            disabled={isBusy}
            checked={agreeTerms}
            onChange={(e) => {
              setAgreeTerms(e.target.checked)
              if (fieldErrors.agreeTerms) {
                setFieldErrors((prev) => ({ ...prev, agreeTerms: undefined }))
              }
            }}
          />
          <span>
            Tôi đồng ý với{' '}
            <Link to="/terms" className="font-semibold text-foreground hover:underline">
              Điều khoản dịch vụ
            </Link>{' '}
            và{' '}
            <Link to="/privacy" className="font-semibold text-foreground hover:underline">
              Chính sách bảo mật
            </Link>{' '}
            của CineBook.
          </span>
        </label>

        {fieldErrors.agreeTerms && (
          <p className="text-xs text-destructive pt-0.5 animate-in fade-in-50">
            {fieldErrors.agreeTerms}
          </p>
        )}
      </div>

      {/* Nút Submit đăng ký */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={isBusy}
        disabled={isBusy}
        className="w-full font-bold shadow-xl shadow-primary/25 transition-transform hover:scale-[1.01] active:scale-[0.99] mt-2"
      >
        <UserPlus className="h-4 w-4 mr-2" aria-hidden="true" />
        <span>{isBusy ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản'}</span>
      </Button>

      {/* Login link */}
      <div className="text-center pt-2 text-xs sm:text-sm text-muted-foreground">
        <span>Đã có tài khoản CineBook? </span>
        <Link
          to="/login"
          className="font-bold text-primary hover:underline hover:text-primary/90 transition-colors"
        >
          Đăng nhập ngay
        </Link>
      </div>
    </form>
  )
}

export default RegisterForm
