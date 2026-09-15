import type {
  AdminUser,
  AdminUserRole,
  AdminUserStatus,
  UserFilterState,
  UserPaginationResult,
  UserSummary,
} from '@/types/admin-user'

const STORAGE_KEY = 'cinebook_admin_users'

const INITIAL_ADMIN_USERS: AdminUser[] = [
  {
    id: 'usr-demo-01',
    fullName: 'Nguyễn Văn An',
    email: 'demo@cinebook.vn',
    phone: '0912 345 678',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
    roles: ['USER', 'ADMIN'],
    tier: 'DIAMOND',
    points: 1250,
    status: 'ACTIVE',
    joinedAt: '2024-03-01 09:00',
    lastLogin: '2026-09-15 15:40',
    totalSpent: 12450000,
    bookingCount: 14,
    recentBookings: [
      {
        id: 'bk-849201',
        bookingCode: 'CB-849201',
        movieTitle: 'Dune: Hành Tinh Cát - Phần Hai',
        showtime: '2026-09-15 19:30',
        finalTotal: 435000,
        status: 'CONFIRMED',
        createdAt: '2026-09-15 14:10',
      },
    ],
    auditLogs: [
      {
        id: 'log-u1',
        action: 'ROLE_CHANGE',
        description: 'Cấp quyền Quản trị viên hệ thống (ROLE_ADMIN)',
        actor: 'Hệ thống (System Bootstrap)',
        timestamp: '2024-03-01 09:00',
        previousValue: 'USER',
        newValue: 'USER, ADMIN',
        reason: 'Khởi tạo tài khoản quản trị mặc định',
      },
    ],
  },
  {
    id: 'usr-admin-02',
    fullName: 'Trần Bảo Long',
    email: 'long.tran@cinebook.vn',
    phone: '0988 123 456',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80',
    roles: ['ADMIN'],
    tier: 'DIAMOND',
    points: 2100,
    status: 'ACTIVE',
    joinedAt: '2024-01-15 10:30',
    lastLogin: '2026-09-15 11:20',
    totalSpent: 18900000,
    bookingCount: 22,
    auditLogs: [
      {
        id: 'log-u2',
        action: 'ROLE_CHANGE',
        description: 'Cấp quyền Quản trị viên trưởng',
        actor: 'Nguyễn Văn An (Admin)',
        timestamp: '2024-01-15 10:35',
        previousValue: 'USER',
        newValue: 'ADMIN',
        reason: 'Bổ nhiệm phụ trách vận hành rạp',
      },
    ],
  },
  {
    id: 'usr-tran-thi-b',
    fullName: 'Trần Thị Bích',
    email: 'bich.tran@outlook.com',
    phone: '0912345678',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    roles: ['USER'],
    tier: 'GOLD',
    points: 650,
    status: 'ACTIVE',
    joinedAt: '2024-05-20 14:15',
    lastLogin: '2026-09-15 13:35',
    totalSpent: 4200000,
    bookingCount: 5,
    recentBookings: [
      {
        id: 'bk-849202',
        bookingCode: 'CB-849202',
        movieTitle: 'Oppenheimer',
        showtime: '2026-09-15 20:15',
        finalTotal: 330000,
        status: 'CONFIRMED',
        createdAt: '2026-09-15 13:38',
      },
    ],
    auditLogs: [],
  },
  {
    id: 'usr-le-hoang-c',
    fullName: 'Lê Hoàng Cường',
    email: 'cuong.le@techcorp.vn',
    phone: '0988776655',
    roles: ['USER'],
    tier: 'SILVER',
    points: 320,
    status: 'ACTIVE',
    joinedAt: '2024-08-10 16:45',
    lastLogin: '2026-09-15 15:10',
    totalSpent: 2100000,
    bookingCount: 3,
    recentBookings: [
      {
        id: 'bk-849203',
        bookingCode: 'CB-849203',
        movieTitle: 'Mai',
        showtime: '2026-09-15 18:00',
        finalTotal: 579000,
        status: 'PENDING_PAYMENT',
        createdAt: '2026-09-15 15:15',
      },
    ],
    auditLogs: [],
  },
  {
    id: 'usr-pham-minh-d',
    fullName: 'Phạm Minh Đức',
    email: 'duc.pham@gmail.com',
    phone: '0977112233',
    roles: ['USER'],
    tier: 'MEMBER',
    points: 120,
    status: 'ACTIVE',
    joinedAt: '2025-01-05 08:20',
    lastLogin: '2026-09-15 11:00',
    totalSpent: 850000,
    bookingCount: 1,
    recentBookings: [
      {
        id: 'bk-849204',
        bookingCode: 'CB-849204',
        movieTitle: 'Quật Mộ Trùng Ma',
        showtime: '2026-09-15 21:00',
        finalTotal: 120000,
        status: 'EXPIRED',
        createdAt: '2026-09-15 11:00',
      },
    ],
    auditLogs: [],
  },
  {
    id: 'usr-hoang-thuy-e',
    fullName: 'Hoàng Thúy Nga',
    email: 'thuynga.hoang@gmail.com',
    phone: '0933445566',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    roles: ['USER'],
    tier: 'DIAMOND',
    points: 1800,
    status: 'ACTIVE',
    joinedAt: '2024-02-14 11:10',
    lastLogin: '2026-09-15 08:25',
    totalSpent: 15600000,
    bookingCount: 18,
    recentBookings: [
      {
        id: 'bk-849205',
        bookingCode: 'CB-849205',
        movieTitle: 'Kung Fu Panda 4',
        showtime: '2026-09-16 10:00',
        finalTotal: 700000,
        status: 'REFUND_PENDING',
        createdAt: '2026-09-14 16:15',
      },
    ],
    auditLogs: [],
  },
  {
    id: 'usr-vu-hoang-f',
    fullName: 'Vũ Hoàng Nam',
    email: 'nam.vu@gmail.com',
    phone: '0966554433',
    roles: ['USER'],
    tier: 'GOLD',
    points: 790,
    status: 'ACTIVE',
    joinedAt: '2024-06-12 19:00',
    lastLogin: '2026-09-14 18:40',
    totalSpent: 5300000,
    bookingCount: 7,
    recentBookings: [
      {
        id: 'bk-849206',
        bookingCode: 'CB-849206',
        movieTitle: 'Godzilla x Kong: Đế Chế Mới',
        showtime: '2026-09-14 19:00',
        finalTotal: 530000,
        status: 'REFUNDED',
        createdAt: '2026-09-13 10:05',
      },
    ],
    auditLogs: [],
  },
  {
    id: 'usr-do-quynh-g',
    fullName: 'Đỗ Quỳnh Chi',
    email: 'quynhchi.do@gmail.com',
    phone: '0922889900',
    roles: ['USER'],
    tier: 'SILVER',
    points: 410,
    status: 'SUSPENDED',
    joinedAt: '2024-09-01 10:00',
    lastLogin: '2026-09-15 10:05',
    totalSpent: 2850000,
    bookingCount: 4,
    recentBookings: [
      {
        id: 'bk-849207',
        bookingCode: 'CB-849207',
        movieTitle: 'Thám Tử Lừng Danh Conan',
        showtime: '2026-09-15 17:30',
        finalTotal: 285000,
        status: 'CANCELLED',
        createdAt: '2026-09-15 10:10',
      },
    ],
    auditLogs: [
      {
        id: 'log-u3',
        action: 'STATUS_CHANGE',
        description: 'Đình chỉ tài khoản tạm thời',
        actor: 'Trần Bảo Long (Admin)',
        timestamp: '2026-09-15 11:30',
        previousValue: 'ACTIVE',
        newValue: 'SUSPENDED',
        reason: 'Phát hiện đăng nhập bất thường từ nhiều địa chỉ IP lạ',
      },
    ],
  },
  {
    id: 'usr-tran-quoc-h',
    fullName: 'Trần Quốc Hùng',
    email: 'quoc.hung@gmail.com',
    phone: '0911223344',
    roles: ['USER'],
    tier: 'GOLD',
    points: 850,
    status: 'ACTIVE',
    joinedAt: '2024-04-18 15:30',
    lastLogin: '2026-09-15 15:15',
    totalSpent: 6200000,
    bookingCount: 8,
    recentBookings: [
      {
        id: 'bk-849208',
        bookingCode: 'CB-849208',
        movieTitle: 'Dune: Hành Tinh Cát - Phần Hai',
        showtime: '2026-09-15 19:30',
        finalTotal: 650000,
        status: 'CONFIRMED',
        createdAt: '2026-09-15 15:18',
      },
    ],
    auditLogs: [],
  },
  {
    id: 'usr-ha-mai-k',
    fullName: 'Hà Mai Khanh',
    email: 'maikhanh.ha@gmail.com',
    phone: '0908877665',
    roles: ['USER'],
    tier: 'DIAMOND',
    points: 1450,
    status: 'ACTIVE',
    joinedAt: '2024-03-22 17:40',
    lastLogin: '2026-09-15 09:20',
    totalSpent: 11800000,
    bookingCount: 13,
    recentBookings: [
      {
        id: 'bk-849209',
        bookingCode: 'CB-849209',
        movieTitle: 'Oppenheimer',
        showtime: '2026-09-16 14:00',
        finalTotal: 350000,
        status: 'CONFIRMED',
        createdAt: '2026-09-15 09:25',
      },
    ],
    auditLogs: [],
  },
  {
    id: 'usr-bui-gia-l',
    fullName: 'Bùi Gia Linh',
    email: 'gialinh.bui@gmail.com',
    phone: '0909988776',
    roles: ['USER'],
    tier: 'MEMBER',
    points: 90,
    status: 'ACTIVE',
    joinedAt: '2025-02-10 13:20',
    lastLogin: '2026-09-15 15:18',
    totalSpent: 650000,
    bookingCount: 1,
    recentBookings: [
      {
        id: 'bk-849210',
        bookingCode: 'CB-849210',
        movieTitle: 'Mai',
        showtime: '2026-09-15 18:00',
        finalTotal: 110000,
        status: 'PENDING_PAYMENT',
        createdAt: '2026-09-15 15:20',
      },
    ],
    auditLogs: [],
  },
  {
    id: 'usr-spam-bot',
    fullName: 'Nguyễn Hữu Thắng',
    email: 'thang.bot99@tempmail.com',
    phone: '0999888777',
    roles: ['USER'],
    tier: 'MEMBER',
    points: 0,
    status: 'LOCKED',
    joinedAt: '2026-09-10 03:15',
    lastLogin: '2026-09-10 03:20',
    totalSpent: 0,
    bookingCount: 0,
    auditLogs: [
      {
        id: 'log-u4',
        action: 'STATUS_CHANGE',
        description: 'Khóa tài khoản vĩnh viễn',
        actor: 'Hệ thống chống Gian lận (Anti-Fraud Bot)',
        timestamp: '2026-09-10 03:22',
        previousValue: 'ACTIVE',
        newValue: 'LOCKED',
        reason: 'Hành vi gửi yêu cầu giữ ghế tự động bất thường hàng loạt',
      },
    ],
  },
]

function getStoredUsers(): AdminUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ADMIN_USERS))
      return INITIAL_ADMIN_USERS
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_ADMIN_USERS
  } catch (err) {
    console.error('Failed to load users from localStorage:', err)
    return INITIAL_ADMIN_USERS
  }
}

function saveUsers(users: AdminUser[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
  } catch (err) {
    console.error('Failed to save users to localStorage:', err)
  }
}

export function getAdminUsers(filters?: Partial<UserFilterState>): UserPaginationResult {
  const allUsers = getStoredUsers()

  const search = filters?.search?.trim().toLowerCase() || ''
  const role = filters?.role || 'ALL'
  const status = filters?.status || 'ALL'
  const tier = filters?.tier || 'ALL'
  const page = filters?.page || 1
  const pageSize = filters?.pageSize || 10
  const sortBy = filters?.sortBy || 'joinedAt'
  const sortOrder = filters?.sortOrder || 'desc'

  let filtered = allUsers.filter((u) => {
    // Search
    if (search) {
      const matchName = u.fullName.toLowerCase().includes(search)
      const matchEmail = u.email.toLowerCase().includes(search)
      const matchPhone = u.phone.includes(search)
      const matchId = u.id.toLowerCase().includes(search)
      if (!matchName && !matchEmail && !matchPhone && !matchId) {
        return false
      }
    }

    // Role filter
    if (role !== 'ALL' && !u.roles.includes(role)) {
      return false
    }

    // Status filter
    if (status !== 'ALL' && u.status !== status) {
      return false
    }

    // Tier filter
    if (tier !== 'ALL' && u.tier !== tier) {
      return false
    }

    return true
  })

  // Sort
  filtered.sort((a, b) => {
    let comparison = 0
    if (sortBy === 'joinedAt') {
      comparison = new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
    } else if (sortBy === 'lastLogin') {
      comparison = new Date(a.lastLogin).getTime() - new Date(b.lastLogin).getTime()
    } else if (sortBy === 'points') {
      comparison = a.points - b.points
    } else if (sortBy === 'totalSpent') {
      comparison = a.totalSpent - b.totalSpent
    }

    return sortOrder === 'asc' ? comparison : -comparison
  })

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const validPage = Math.min(page, totalPages)
  const startIndex = (validPage - 1) * pageSize
  const data = filtered.slice(startIndex, startIndex + pageSize)

  return {
    data,
    total,
    page: validPage,
    pageSize,
    totalPages,
  }
}

export function getAdminUserById(id: string): AdminUser | null {
  const allUsers = getStoredUsers()
  return allUsers.find((u) => u.id === id || u.email.toLowerCase() === id.toLowerCase()) || null
}

export function getUserSummary(): UserSummary {
  const allUsers = getStoredUsers()

  let adminCount = 0
  let activeCount = 0
  let suspendedCount = 0

  allUsers.forEach((u) => {
    if (u.roles.includes('ADMIN')) adminCount++
    if (u.status === 'ACTIVE') activeCount++
    if (u.status === 'SUSPENDED' || u.status === 'LOCKED') suspendedCount++
  })

  return {
    totalUsers: allUsers.length,
    adminCount,
    activeCount,
    suspendedCount,
  }
}

export function updateUserStatus(
  id: string,
  newStatus: AdminUserStatus,
  reason: string,
  actor: string
): { success: boolean; message: string; user?: AdminUser } {
  const allUsers = getStoredUsers()
  const userIndex = allUsers.findIndex((u) => u.id === id)

  if (userIndex === -1) {
    return { success: false, message: 'Không tìm thấy người dùng trong hệ thống' }
  }

  const user = allUsers[userIndex]
  const oldStatus = user.status

  if (oldStatus === newStatus) {
    return { success: false, message: `Người dùng đã ở trạng thái ${newStatus}` }
  }

  const now = new Date()
  const timestampStr = now.toISOString().replace('T', ' ').substring(0, 16)

  const newLog = {
    id: `log-${Date.now()}`,
    action: 'STATUS_CHANGE' as const,
    description: `Thay đổi trạng thái tài khoản sang ${newStatus}`,
    actor,
    timestamp: timestampStr,
    previousValue: oldStatus,
    newValue: newStatus,
    reason: reason.trim() || 'Thay đổi trạng thái theo yêu cầu quản trị viên',
  }

  const updatedUser: AdminUser = {
    ...user,
    status: newStatus,
    auditLogs: [newLog, ...user.auditLogs],
  }

  allUsers[userIndex] = updatedUser
  saveUsers(allUsers)

  return {
    success: true,
    message: `Đã cập nhật trạng thái của ${user.fullName} thành ${newStatus}.`,
    user: updatedUser,
  }
}

export function updateUserRoles(
  id: string,
  newRoles: AdminUserRole[],
  reason: string,
  actor: string
): { success: boolean; message: string; user?: AdminUser } {
  const allUsers = getStoredUsers()
  const userIndex = allUsers.findIndex((u) => u.id === id)

  if (userIndex === -1) {
    return { success: false, message: 'Không tìm thấy người dùng trong hệ thống' }
  }

  const user = allUsers[userIndex]
  const oldRolesStr = user.roles.join(', ')
  const newRolesStr = newRoles.join(', ')

  if (oldRolesStr === newRolesStr) {
    return { success: false, message: 'Danh sách vai trò không có thay đổi' }
  }

  if (newRoles.length === 0) {
    return { success: false, message: 'Người dùng phải có ít nhất một vai trò' }
  }

  const now = new Date()
  const timestampStr = now.toISOString().replace('T', ' ').substring(0, 16)

  const newLog = {
    id: `log-${Date.now()}`,
    action: 'ROLE_CHANGE' as const,
    description: `Cập nhật vai trò từ [${oldRolesStr}] sang [${newRolesStr}]`,
    actor,
    timestamp: timestampStr,
    previousValue: oldRolesStr,
    newValue: newRolesStr,
    reason: reason.trim() || 'Cập nhật phân quyền theo chính sách quản trị',
  }

  const updatedUser: AdminUser = {
    ...user,
    roles: newRoles,
    auditLogs: [newLog, ...user.auditLogs],
  }

  allUsers[userIndex] = updatedUser
  saveUsers(allUsers)

  return {
    success: true,
    message: `Đã cập nhật vai trò của ${user.fullName} thành [${newRolesStr}].`,
    user: updatedUser,
  }
}

/**
 * Real client-side CSV Export helper with UTF-8 BOM for Microsoft Excel compatibility
 * Password is NEVER exported or processed
 */
export function exportUsersToCSV(users: AdminUser[]): void {
  if (!users || users.length === 0) {
    return
  }

  const headers = [
    'Mã Người Dùng',
    'Họ Tên',
    'Email',
    'Số Điện Thoại',
    'Vai Trò (Roles)',
    'Hạng Hội Viên',
    'Điểm Tích Lũy',
    'Trạng Thái',
    'Ngày Tham Gia',
    'Lần Đăng Nhập Cuối',
    'Tổng Chi Tiêu (VND)',
    'Số Đơn Đặt Vé',
  ]

  const statusLabels: Record<string, string> = {
    ACTIVE: 'Hoạt động',
    SUSPENDED: 'Tạm đình chỉ',
    LOCKED: 'Đã khóa',
  }

  const escapeCSV = (value: string | number | undefined | null) => {
    if (value === undefined || value === null) return '""'
    const str = String(value).replace(/"/g, '""')
    return `"${str}"`
  }

  const rows = users.map((u) => {
    return [
      escapeCSV(u.id),
      escapeCSV(u.fullName),
      escapeCSV(u.email),
      escapeCSV(u.phone),
      escapeCSV(u.roles.join(', ')),
      escapeCSV(u.tier),
      escapeCSV(u.points),
      escapeCSV(statusLabels[u.status] || u.status),
      escapeCSV(u.joinedAt),
      escapeCSV(u.lastLogin),
      escapeCSV(u.totalSpent),
      escapeCSV(u.bookingCount),
    ].join(',')
  })

  // Prepend UTF-8 BOM (\uFEFF) for Excel compatibility
  const csvContent = '\uFEFF' + [headers.map(escapeCSV).join(','), ...rows].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  const timestamp = new Date().toISOString().slice(0, 10)
  link.setAttribute('href', url)
  link.setAttribute('download', `CineBook_Users_${timestamp}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
