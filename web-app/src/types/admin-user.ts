export type AdminUserRole = 'USER' | 'ADMIN'
export type AdminUserStatus = 'ACTIVE' | 'SUSPENDED' | 'LOCKED'
export type MembershipTier = 'DIAMOND' | 'GOLD' | 'SILVER' | 'MEMBER'

export interface UserAuditLog {
  id: string
  action: 'ROLE_CHANGE' | 'STATUS_CHANGE' | 'PROFILE_UPDATE'
  description: string
  actor: string
  timestamp: string
  previousValue: string
  newValue: string
  reason?: string
}

export interface AdminUserBookingSnapshot {
  id: string
  bookingCode: string
  movieTitle: string
  showtime: string
  finalTotal: number
  status: string
  createdAt: string
}

export interface AdminUser {
  id: string
  fullName: string
  email: string
  phone: string
  avatarUrl?: string
  roles: AdminUserRole[]
  tier: MembershipTier
  points: number
  status: AdminUserStatus
  joinedAt: string
  lastLogin: string
  totalSpent: number
  bookingCount: number
  recentBookings?: AdminUserBookingSnapshot[]
  auditLogs: UserAuditLog[]
}

export interface UserSummary {
  totalUsers: number
  adminCount: number
  activeCount: number
  suspendedCount: number
}

export interface UserFilterState {
  search: string
  role: 'ALL' | AdminUserRole
  status: 'ALL' | AdminUserStatus
  tier: 'ALL' | MembershipTier
  page: number
  pageSize: number
  sortBy: 'joinedAt' | 'lastLogin' | 'points' | 'totalSpent'
  sortOrder: 'asc' | 'desc'
}

export interface UserPaginationResult {
  data: AdminUser[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
