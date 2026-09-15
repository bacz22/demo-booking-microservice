import * as React from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFormFieldContext } from '@/components/ui/form-field-context'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Hiển thị trạng thái lỗi với viền đỏ, hiệu ứng cảnh báo hoặc chuỗi thông báo lỗi trực tiếp */
  error?: boolean | string
  /** Thông báo lỗi hiển thị bên dưới input (dành cho khi dùng Input độc lập không qua FormField) */
  errorMessage?: string
  /** Hướng dẫn phụ hiển thị bên dưới input */
  helperText?: string
  /** Icon hoặc thành phần hiển thị phía trước input */
  leftIcon?: React.ReactNode
  /** Icon hoặc thành phần hiển thị phía sau input */
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      error: propError,
      errorMessage,
      helperText,
      leftIcon,
      rightIcon,
      id: propId,
      ...props
    },
    ref
  ) => {
    // Tự động kế thừa id và trạng thái lỗi nếu được bọc bên trong FormField
    const fieldContext = useFormFieldContext()
    const id = propId || fieldContext?.id

    // Xác định trạng thái lỗi
    const hasError = Boolean(
      propError ||
      errorMessage ||
      fieldContext?.hasError ||
      props['aria-invalid']
    )

    // Thông báo lỗi dạng chữ chỉ hiển thị bên dưới Input khi dùng độc lập ngoài FormField (tránh trùng lặp thông báo lỗi)
    const errorText = !fieldContext
      ? (typeof propError === 'string' ? propError : errorMessage)
      : undefined

    const isCheckbox = type === 'checkbox'
    const isRadio = type === 'radio'

    // Xử lý riêng biệt cho checkbox và radio
    if (isCheckbox || isRadio) {
      return (
        <input
          type={type}
          ref={ref}
          id={id}
          aria-invalid={hasError}
          className={cn(
            'h-4 w-4 rounded border-border/60 text-primary accent-primary focus:ring-2 focus:ring-primary/40 focus:ring-offset-0 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50',
            isRadio && 'rounded-full',
            hasError && 'border-destructive ring-1 ring-destructive/40',
            className
          )}
          {...props}
        />
      )
    }

    // Tự động hiển thị AlertCircle ở bên phải nếu có lỗi và không truyền custom rightIcon
    const effectiveRightIcon =
      rightIcon ||
      (hasError ? (
        <AlertCircle
          className="h-4 w-4 text-destructive animate-in fade-in zoom-in-75 duration-150"
          aria-hidden="true"
        />
      ) : null)

    const inputNode = (
      <input
        type={type}
        ref={ref}
        id={id}
        aria-invalid={hasError}
        aria-describedby={
          hasError && id ? `${id}-error` : props['aria-describedby']
        }
        className={cn(
          'w-full rounded-xl border bg-background/60 px-4 py-2.5 text-sm text-foreground shadow-xs transition-all duration-150 outline-hidden',
          'placeholder:text-muted-foreground/60',
          'focus:border-primary focus:ring-2 focus:ring-primary/25',
          'disabled:cursor-not-allowed disabled:opacity-50',
          hasError
            ? 'border-destructive bg-destructive/5 ring-1 ring-destructive/30 placeholder:text-destructive/40 focus:border-destructive focus:ring-2 focus:ring-destructive/30 focus:bg-background'
            : 'border-border/60 hover:border-border',
          leftIcon && 'pl-11',
          effectiveRightIcon && 'pr-11',
          className
        )}
        {...props}
      />
    )

    const content = (
      <div className="relative flex w-full items-center">
        {leftIcon && (
          <div className="pointer-events-none absolute left-3.5 flex items-center justify-center text-muted-foreground">
            {leftIcon}
          </div>
        )}
        {inputNode}
        {effectiveRightIcon && (
          <div className="pointer-events-none absolute right-3.5 flex items-center justify-center">
            {effectiveRightIcon}
          </div>
        )}
      </div>
    )

    // Nếu không có thông báo lỗi riêng hoặc helperText, chỉ hiển thị input
    if (!errorText && !helperText) {
      return content
    }

    // Hiển thị thông báo lỗi hoặc helperText bên dưới input nếu dùng độc lập
    return (
      <div className="w-full space-y-1">
        {content}
        {errorText && (
          <p
            id={id ? `${id}-error` : undefined}
            role="alert"
            className="flex items-center gap-1.5 text-xs text-destructive animate-in fade-in-50 duration-150"
          >
            <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span>{errorText}</span>
          </p>
        )}
        {helperText && !errorText && (
          <p className="text-[11px] text-muted-foreground">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
