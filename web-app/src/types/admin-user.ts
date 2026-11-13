import type { BackendAuthUser } from '@/services/auth-api.service'

export type {
  AdminUserRole,
  AdminUserStatus,
  AdminUserSummary,
  AdminUserQuery,
} from '@/services/admin-api.service'

/** Người dùng trả về từ auth-service (/api/admin/users) */
export type AdminUser = BackendAuthUser

/** Bộ lọc danh sách người dùng (đồng bộ với URL). Backend luôn sắp xếp theo createdAt giảm dần. */
export interface UserFilterState {
  search: string
  role: 'ALL' | 'USER' | 'ADMIN'
  status: 'ALL' | 'ACTIVE' | 'LOCKED'
  /** 1-based trên giao diện; đổi sang 0-based khi gọi API */
  page: number
  pageSize: number
}
