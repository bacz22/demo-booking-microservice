import type { PaymentMethod, AdminPaymentStatus } from './admin-booking'

export interface PaymentCustomer {
  id: string
  fullName: string
  email: string
  phone: string
}

export type PaymentTimelineStep =
  | 'REQUESTED'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REFUND_REQUESTED'
  | 'REFUNDED'

export interface PaymentTimelineItem {
  id: string
  step: PaymentTimelineStep
  title: string
  description: string
  timestamp: string
  actor: 'USER' | 'SYSTEM' | 'ADMIN'
  responseCode?: string
}

export interface AdminPayment {
  id: string // e.g. pay-vn-992182
  bookingId: string // e.g. bk-849201
  bookingCode: string // e.g. CB-849201
  customer: PaymentCustomer
  amount: number
  currency: 'VND'
  method: PaymentMethod
  status: AdminPaymentStatus
  providerRef: string // Transaction ref from payment gateway (VNPAY, MoMo, etc.)
  bankCode?: string
  cardType?: string
  createdAt: string
  updatedAt: string
  paidAt?: string
  refundedAt?: string
  refundAmount?: number
  refundReason?: string
  timeline: PaymentTimelineItem[]
  rawResponse: Record<string, unknown> // Redacted sensitive data
}

export interface PaymentSummary {
  grossAmount: number
  succeededAmount: number
  succeededCount: number
  failedAmount: number
  failedCount: number
  pendingAmount: number
  pendingCount: number
  refundedAmount: number
  refundedCount: number
}

export interface PaymentFilterState {
  search: string
  method: 'ALL' | PaymentMethod
  status: 'ALL' | AdminPaymentStatus
  startDate: string
  endDate: string
  page: number
  pageSize: number
  sortBy: 'createdAt' | 'amount'
  sortOrder: 'asc' | 'desc'
}

export interface PaymentPaginationResult {
  data: AdminPayment[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
