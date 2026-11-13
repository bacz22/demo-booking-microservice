import type { BackendPaymentResponse, BackendPaymentStatus } from './payment'
import type { BackendAuthUser } from '@/services/auth-api.service'

/** Giao dịch thanh toán (từ payment-service) kèm thông tin khách (từ auth-service) */
export interface AdminPaymentRow extends BackendPaymentResponse {
  customer: Pick<BackendAuthUser, 'id' | 'fullName' | 'email' | 'phone'> | null
}

export type PaymentTimelineTone = 'neutral' | 'info' | 'success' | 'danger' | 'warning'

export interface PaymentTimelineItem {
  id: string
  title: string
  description: string
  timestamp: string
  tone: PaymentTimelineTone
}

export interface PaymentFilterState {
  search: string
  status: 'ALL' | BackendPaymentStatus
  bookingId: string
  startDate: string
  endDate: string
  page: number
  pageSize: number
  sortBy: 'createdAt' | 'amount'
  sortOrder: 'asc' | 'desc'
}
