export type PaymentMethodId = 'vnpay' | 'momo' | 'card'

export interface PaymentMethodOption {
  id: PaymentMethodId
  title: string
  subtitle: string
  badge?: string
}

export type BackendPaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED'

/** PaymentResponse từ payment-service */
export interface BackendPaymentResponse {
  id: string
  paymentCode: string
  bookingId: string
  userId: string
  amount: number
  currency: string
  method: string
  status: BackendPaymentStatus
  providerRef: string | null
  failureCode: string | null
  failureMessage: string | null
  bookingExpiresAt: string | null
  paidAt: string | null
  failedAt: string | null
  createdAt: string
}

export interface CompletePaymentRequest {
  success: boolean
  providerRef?: string
  failureCode?: string
  failureMessage?: string
}
