import * as React from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

import { FormFieldContext, type FormFieldContextValue } from '@/components/ui/form-field-context'

export interface FormFieldProps {
  /** ID kết nối label với input */
  id?: string
  /** Nhãn hiển thị của trường dữ liệu */
  label?: React.ReactNode
  /** Icon hiển thị cùng nhãn */
  icon?: React.ReactNode
  /** Ghi chú giải thích phụ cho trường dữ liệu */
  description?: React.ReactNode
  /** Thông báo lỗi của trường dữ liệu */
  error?: string | null
  /** Đánh dấu trường bắt buộc nhập */
  required?: boolean
  className?: string
  children: React.ReactNode
}

export function FormField({
  id,
  label,
  icon,
  description,
  error,
  required,
  className,
  children,
}: FormFieldProps) {
  const contextValue = React.useMemo<FormFieldContextValue>(
    () => ({
      id,
      error,
      hasError: Boolean(error),
    }),
    [id, error]
  )

  return (
    <FormFieldContext.Provider value={contextValue}>
      <div className={cn('space-y-1.5', className)}>
        {label && (
          <label
            htmlFor={id}
            className="text-xs sm:text-sm font-medium text-foreground flex items-center gap-1.5 select-none"
          >
            {icon && (
              <span className="text-primary shrink-0" aria-hidden="true">
                {icon}
              </span>
            )}
            <span>{label}</span>
            {required && (
              <span className="text-destructive font-bold text-xs" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        {children}

        {description && !error && (
          <p className="text-[11px] text-muted-foreground leading-tight">
            {description}
          </p>
        )}

        {error && (
          <p
            id={id ? `${id}-error` : undefined}
            role="alert"
            aria-live="polite"
            className="text-xs text-destructive flex items-center gap-1.5 pt-0.5 animate-in fade-in-50 duration-150"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}
      </div>
    </FormFieldContext.Provider>
  )
}

export default FormField
