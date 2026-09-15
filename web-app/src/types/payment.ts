export type PaymentMethodId = 'vnpay' | 'momo' | 'card'

export interface PaymentMethodOption {
  id: PaymentMethodId
  title: string
  subtitle: string
  badge?: string
}
