/**
 * API quản trị thật (qua API Gateway, cần token có quyền ADMIN):
 * - booking-service:  /api/admin/bookings
 * - payment-service:  /api/admin/payments
 * - auth-service:     /api/admin/users
 */
import { apiClient } from '@/lib/api-client'
import type { BackendBookingResponse } from '@/types/booking'
import type { BackendPaymentResponse, BackendPaymentStatus } from '@/types/payment'
import type { BackendAuthUser } from '@/services/auth-api.service'

// ---------- kiểu dữ liệu chung ----------

/** Trang kết quả của mọi API admin mới */
export interface AdminPageResponse<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type SortOrder = 'asc' | 'desc'
export type BackendBookingStatus = BackendBookingResponse['status']

export interface AdminBookingQuery {
  q?: string
  status?: BackendBookingStatus
  movieId?: string
  theaterId?: string
  userId?: string
  /** yyyy-MM-dd (giờ VN), lọc theo ngày tạo */
  from?: string
  to?: string
  sortBy?: 'createdAt' | 'totalAmount' | 'showtimeStart'
  sortOrder?: SortOrder
  page?: number
  pageSize?: number
}

export interface AdminBookingStats {
  from: string
  to: string
  revenue: number
  confirmedBookings: number
  seatsSold: number
  createdBookings: number
  byStatus: Record<BackendBookingStatus, number>
  daily: Array<{ date: string; revenue: number; confirmedBookings: number; seatsSold: number }>
}

export interface AdminPaymentQuery {
  q?: string
  status?: BackendPaymentStatus
  userId?: string
  bookingId?: string
  from?: string
  to?: string
  sortBy?: 'createdAt' | 'amount'
  sortOrder?: SortOrder
  page?: number
  pageSize?: number
}

export interface AdminPaymentAttempt {
  id: string
  attemptNumber: number
  status: 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | string
  providerRef: string | null
  failureCode: string | null
  failureMessage: string | null
  startedAt: string
  endedAt: string | null
}

export interface AdminPaymentDetail {
  payment: BackendPaymentResponse
  attempts: AdminPaymentAttempt[]
}

export interface AdminPaymentSummary {
  from: string
  to: string
  totalCount: number
  totalAmount: number
  byStatus: Record<BackendPaymentStatus, { count: number; amount: number }>
  /** 0..1, null khi chưa có giao dịch kết thúc */
  successRate: number | null
}

export type AdminUserRole = 'USER' | 'ADMIN'
export type AdminUserStatus = 'ACTIVE' | 'LOCKED'

export interface AdminUserQuery {
  q?: string
  role?: AdminUserRole
  status?: AdminUserStatus
  page?: number
  pageSize?: number
}

export interface AdminUserSummary {
  totalUsers: number
  activeUsers: number
  lockedUsers: number
  adminUsers: number
}

// ---------- helpers ----------

function toQuery(params: object): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  })
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

/** Ngày yyyy-MM-dd theo giờ Việt Nam (backend tính khoảng ngày theo Asia/Ho_Chi_Minh). */
export function toVnDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(date)
}

// ---------- booking ----------

export const adminBookingApi = {
  list(query: AdminBookingQuery = {}) {
    return apiClient.get<AdminPageResponse<BackendBookingResponse>>(`/admin/bookings${toQuery(query)}`)
  },
  get(id: string) {
    return apiClient.get<BackendBookingResponse>(`/admin/bookings/${id}`)
  },
  /** Chỉ huỷ được đơn PENDING_PAYMENT; đơn đã thanh toán trả 409 INVALID_BOOKING_STATE. */
  cancel(id: string, reason?: string) {
    return apiClient.post<BackendBookingResponse>(`/admin/bookings/${id}/cancel`, { reason })
  },
  stats(from: string, to: string) {
    return apiClient.get<AdminBookingStats>(`/admin/bookings/stats${toQuery({ from, to })}`)
  },
  /** Số ghế đã bán (CONFIRMED) theo suất chiếu */
  soldSeats(showtimeIds: string[]) {
    if (showtimeIds.length === 0) return Promise.resolve({} as Record<string, number>)
    return apiClient.get<Record<string, number>>(`/admin/bookings/sold-seats?showtimeIds=${showtimeIds.join(',')}`)
  },
}

// ---------- payment ----------

export const adminPaymentApi = {
  list(query: AdminPaymentQuery = {}) {
    return apiClient.get<AdminPageResponse<BackendPaymentResponse>>(`/admin/payments${toQuery(query)}`)
  },
  get(id: string) {
    return apiClient.get<AdminPaymentDetail>(`/admin/payments/${id}`)
  },
  summary(from: string, to: string) {
    return apiClient.get<AdminPaymentSummary>(`/admin/payments/summary${toQuery({ from, to })}`)
  },
}

// ---------- user ----------

export const adminUserApi = {
  list(query: AdminUserQuery = {}) {
    return apiClient.get<AdminPageResponse<BackendAuthUser>>(`/admin/users${toQuery(query)}`)
  },
  /** Lấy nhiều user một lần (tối đa 200) để ghép tên/email khách vào danh sách khác. */
  async byIds(ids: string[]): Promise<Record<string, BackendAuthUser>> {
    const unique = [...new Set(ids.filter(Boolean))]
    if (unique.length === 0) return {}
    const users = await apiClient.get<BackendAuthUser[]>(`/admin/users?ids=${unique.join(',')}`)
    return Object.fromEntries(users.map((u) => [u.id, u]))
  },
  get(id: string) {
    return apiClient.get<BackendAuthUser>(`/admin/users/${id}`)
  },
  summary() {
    return apiClient.get<AdminUserSummary>('/admin/users/summary')
  },
  updateStatus(id: string, status: AdminUserStatus) {
    return apiClient.patch<BackendAuthUser>(`/admin/users/${id}/status`, { status })
  },
  updateRoles(id: string, roles: AdminUserRole[]) {
    return apiClient.put<BackendAuthUser>(`/admin/users/${id}/roles`, { roles })
  },
}

// ---------- CSV ----------

/** Tạo file CSV (UTF-8 có BOM để Excel đọc đúng tiếng Việt) và tải xuống. */
export function downloadCsv(filename: string, header: string[], rows: Array<Array<string | number | null | undefined>>) {
  const escape = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [header, ...rows].map((r) => r.map(escape).join(',')).join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
