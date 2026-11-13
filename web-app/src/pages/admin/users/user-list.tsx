import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Users,
  Search,
  X,
  RotateCcw,
  Download,
  Eye,
  ShieldCheck,
  UserCheck,
  UserX,
} from 'lucide-react'
import type { AdminUser, AdminUserRole, AdminUserStatus, AdminUserSummary } from '@/types/admin-user'
import { adminUserApi, downloadCsv } from '@/services/admin-api.service'
import { PageErrorState } from '@/components/ui/page-error-state'
import { UserInitialsAvatar } from '@/components/admin/users/user-initials-avatar'
import { USER_STATUS_LABEL, errorMessage, formatDateTime } from '@/components/admin/users/user-utils'
import { useAuth } from '@/context/auth-context'
import { AdminPageHeader } from '@/components/admin/common/admin-page-header'
import { AdminStatusBadge } from '@/components/admin/common/admin-status-badge'
import { AdminPagination } from '@/components/admin/common/admin-pagination'
import { AdminConfirmDialog } from '@/components/admin/common/admin-confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

const EXPORT_PAGE_SIZE = 100
const EXPORT_MAX_ROWS = 5000

export default function AdminUserList() {
  const { user: currentUser } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  // Filters from query params
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [role, setRole] = useState<string>(searchParams.get('role') || 'ALL')
  const [status, setStatus] = useState<string>(searchParams.get('status') || 'ALL')
  const [page, setPage] = useState<number>(Number(searchParams.get('page')) || 1)
  const [pageSize, setPageSize] = useState<number>(Number(searchParams.get('pageSize')) || 10)

  // Data states
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<AdminUserSummary | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState(search.trim())
  const [isExporting, setIsExporting] = useState(false)

  // Lock/Unlock Dialog
  const [statusTarget, setStatusTarget] = useState<AdminUser | null>(null)
  const [statusAction, setStatusAction] = useState<'LOCK' | 'ACTIVATE'>('LOCK')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Sync state with URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (role !== 'ALL') params.set('role', role)
    if (status !== 'ALL') params.set('status', status)
    if (page > 1) params.set('page', String(page))
    if (pageSize !== 10) params.set('pageSize', String(pageSize))

    setSearchParams(params, { replace: true })
  }, [search, role, status, page, pageSize, setSearchParams])

  // Debounce ô tìm kiếm để không gọi API mỗi lần gõ phím
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => clearTimeout(t)
  }, [search])

  const buildQuery = useCallback(
    () => ({
      q: debouncedSearch || undefined,
      role: role === 'ALL' ? undefined : (role as AdminUserRole),
      status: status === 'ALL' ? undefined : (status as AdminUserStatus),
    }),
    [debouncedSearch, role, status]
  )

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await adminUserApi.list({ ...buildQuery(), page: page - 1, pageSize })
      setUsers(result.items)
      setTotal(result.total)
      setTotalPages(Math.max(1, result.totalPages))
    } catch (err) {
      setError(errorMessage(err, 'Không thể tải danh sách người dùng'))
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [buildQuery, page, pageSize])

  const fetchSummary = useCallback(async () => {
    try {
      setSummary(await adminUserApi.summary())
    } catch {
      setSummary(null)
    }
  }, [])

  useEffect(() => {
    void fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    void fetchSummary()
  }, [fetchSummary])

  const isFiltered =
    Boolean(search) ||
    role !== 'ALL' ||
    status !== 'ALL'

  const handleResetFilters = () => {
    setSearch('')
    setRole('ALL')
    setStatus('ALL')
    setPage(1)
  }

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const all: AdminUser[] = []
      let p = 0
      let pages = 1
      while (p < pages && all.length < EXPORT_MAX_ROWS) {
        const res = await adminUserApi.list({ ...buildQuery(), page: p, pageSize: EXPORT_PAGE_SIZE })
        all.push(...res.items)
        pages = res.totalPages
        p++
      }

      if (all.length === 0) {
        toast.warning('Không có dữ liệu người dùng phù hợp để xuất file')
        return
      }

      downloadCsv(
        `nguoi-dung-${new Date().toISOString().slice(0, 10)}.csv`,
        ['ID', 'Họ tên', 'Email', 'Số điện thoại', 'Vai trò', 'Trạng thái', 'Ngày tạo'],
        all.map((u) => [
          u.id,
          u.fullName,
          u.email,
          u.phone,
          u.roles.join('|'),
          u.status ? USER_STATUS_LABEL[u.status] : '',
          formatDateTime(u.createdAt),
        ])
      )
      toast.success(`Đã xuất ${all.length} tài khoản người dùng ra file CSV`)
    } catch (err) {
      toast.error(errorMessage(err, 'Không thể xuất file CSV'))
    } finally {
      setIsExporting(false)
    }
  }

  // Handle Lock or Reactivate
  const handleOpenStatusDialog = (target: AdminUser, action: 'LOCK' | 'ACTIVATE') => {
    if (currentUser && currentUser.id === target.id && action === 'LOCK') {
      toast.error('Bạn không thể tự khoá tài khoản của chính mình.')
      return
    }
    setStatusTarget(target)
    setStatusAction(action)
  }

  const handleConfirmStatusChange = async () => {
    if (!statusTarget) return
    setIsUpdatingStatus(true)
    const newStatus: AdminUserStatus = statusAction === 'LOCK' ? 'LOCKED' : 'ACTIVE'
    try {
      await adminUserApi.updateStatus(statusTarget.id, newStatus)
      toast.success(
        newStatus === 'LOCKED'
          ? `Đã khoá tài khoản ${statusTarget.fullName}`
          : `Đã kích hoạt lại tài khoản ${statusTarget.fullName}`
      )
      setStatusTarget(null)
      void fetchUsers()
      void fetchSummary()
    } catch (err) {
      toast.error(errorMessage(err, 'Có lỗi xảy ra khi cập nhật trạng thái người dùng'))
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="Quản Lý Người Dùng & Role"
        description="Kiểm soát danh sách tài khoản khách hàng và phân quyền Quản trị viên (ROLE_ADMIN)"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Người dùng & Role' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleExportCSV()}
              disabled={isExporting || total === 0}
              className="h-9 gap-2 rounded-xl border-border/80 bg-secondary/40 font-bold hover:bg-secondary cursor-pointer shadow-xs"
              title="Tải toàn bộ kết quả lọc ra file CSV UTF-8"
            >
              <Download className="w-4 h-4 text-primary" />
              <span>{isExporting ? 'Đang xuất...' : `Xuất CSV (${total})`}</span>
            </Button>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Tổng người dùng</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-heading tracking-tight text-foreground font-mono tabular-nums">
              {summary?.totalUsers ?? '—'}
            </span>
            <span className="text-xs text-muted-foreground">tài khoản</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Quản trị viên (ADMIN)</span>
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-heading tracking-tight text-primary font-mono tabular-nums">
              {summary?.adminUsers ?? '—'}
            </span>
            <span className="text-xs text-muted-foreground">quản trị viên</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Đang hoạt động</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-heading tracking-tight text-emerald-400 font-mono tabular-nums">
              {summary?.activeUsers ?? '—'}
            </span>
            <span className="text-xs text-emerald-400 font-bold">
              {summary && summary.totalUsers > 0
                ? `${Math.round((summary.activeUsers / summary.totalUsers) * 100)}%`
                : ''}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Đã khoá</span>
            <UserX className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-heading tracking-tight text-rose-400 font-mono tabular-nums">
              {summary?.lockedUsers ?? '—'}
            </span>
            <span className="text-xs text-muted-foreground">tài khoản</span>
          </div>
        </div>
      </div>

      {/* Multi-Criteria Filter Bar */}
      <div className="rounded-2xl border border-border/70 bg-card/50 backdrop-blur-md p-4 space-y-3.5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search box */}
          <div className="relative sm:col-span-2 lg:col-span-5">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm theo họ tên, email, số điện thoại..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-9 pr-8 h-10 rounded-xl bg-secondary/40 border-border/80 text-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setPage(1)
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="sm:col-span-1 lg:col-span-2">
            <Select
              value={role}
              onValueChange={(val) => {
                setRole(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-10 rounded-xl bg-secondary/40 border-border/80 text-xs font-medium">
                <SelectValue placeholder="Vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả vai trò</SelectItem>
                <SelectItem value="ADMIN">Quản trị viên (ADMIN)</SelectItem>
                <SelectItem value="USER">Khách hàng (USER)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-1 lg:col-span-2">
            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-10 rounded-xl bg-secondary/40 border-border/80 text-xs font-medium">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                <SelectItem value="ACTIVE">Hoạt động (ACTIVE)</SelectItem>
                <SelectItem value="LOCKED">Đã khoá (LOCKED)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset button */}
          <div className="sm:col-span-1 lg:col-span-3 flex justify-end">
            {isFiltered && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-10 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer w-full lg:w-auto"
                title="Đặt lại toàn bộ bộ lọc"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="lg:hidden">Xóa lọc</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-secondary/30 text-muted-foreground uppercase tracking-wider font-semibold text-[11px]">
                <th scope="col" className="py-3.5 pl-4 pr-3">
                  Người Dùng
                </th>
                <th scope="col" className="py-3.5 px-3">
                  Vai Trò (Roles)
                </th>
                <th scope="col" className="py-3.5 px-3">
                  Trạng Thái
                </th>
                <th scope="col" className="py-3.5 px-3">
                  Ngày Tạo
                </th>
                <th scope="col" className="py-3.5 pr-4 pl-3 text-center">
                  Thao Tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {loading ? (
                Array.from({ length: pageSize }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 pl-4 pr-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-9 h-9 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-28 rounded" />
                          <Skeleton className="h-3 w-36 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-3">
                      <Skeleton className="h-5 w-16 rounded" />
                    </td>
                    <td className="py-4 px-3">
                      <Skeleton className="h-6 w-20 rounded-lg" />
                    </td>
                    <td className="py-4 px-3">
                      <Skeleton className="h-4 w-24 rounded" />
                    </td>
                    <td className="py-4 pr-4 pl-3 text-center">
                      <Skeleton className="h-8 w-20 rounded-lg mx-auto" />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={5} className="py-10">
                    <PageErrorState
                      title="Không thể tải danh sách người dùng"
                      message={error}
                      onRetry={() => void fetchUsers()}
                    />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <EmptyState
                      icon={Users}
                      title="Không tìm thấy người dùng nào"
                      description={
                        isFiltered
                          ? 'Thử thay đổi bộ lọc tìm kiếm hoặc xóa từ khóa hiện tại'
                          : 'Hiện tại hệ thống chưa có tài khoản nào'
                      }
                      action={
                        isFiltered
                          ? {
                              label: 'Xóa bộ lọc',
                              onClick: handleResetFilters,
                            }
                          : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = currentUser?.id === u.id

                  return (
                    <tr
                      key={u.id}
                      className="group transition-colors hover:bg-secondary/20"
                    >
                      {/* User Info (Avatar + Name + Email) */}
                      <td className="py-3.5 pl-4 pr-3 align-middle">
                        <div className="flex items-center gap-3">
                          <UserInitialsAvatar name={u.fullName} className="w-9 h-9 text-xs" />

                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Link
                                to={`/admin/users/${u.id}`}
                                className="font-bold text-foreground hover:text-primary transition-colors hover:underline truncate"
                              >
                                {u.fullName}
                              </Link>
                              {isSelf && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-primary/15 text-primary border border-primary/30 shrink-0">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <div className="text-muted-foreground text-[11px] truncate max-w-[180px]">
                              {u.email}
                            </div>
                            <div className="text-muted-foreground text-[11px] font-mono">
                              {u.phone || '—'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Roles */}
                      <td className="py-3.5 px-3 align-middle">
                        <div className="flex flex-wrap gap-1 max-w-[130px]">
                          {u.roles.map((r) => (
                            <span
                              key={r}
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border',
                                r === 'ADMIN'
                                  ? 'bg-primary/15 text-primary border-primary/30'
                                  : 'bg-secondary text-secondary-foreground border-border/80'
                              )}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-3 align-middle">
                        {u.status && (
                          <AdminStatusBadge status={u.status} label={USER_STATUS_LABEL[u.status]} size="sm" />
                        )}
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-3 align-middle text-muted-foreground font-mono text-[11px]">
                        {formatDateTime(u.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pr-4 pl-3 align-middle text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 rounded-lg text-xs gap-1 cursor-pointer font-bold border-border/80 hover:bg-secondary"
                          >
                            <Link to={`/admin/users/${u.id}`}>
                              <Eye className="w-3.5 h-3.5 text-primary" />
                              <span>Chi tiết</span>
                            </Link>
                          </Button>

                          {/* Quick Lock / Activate button */}
                          {u.status !== 'LOCKED' ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={isSelf}
                              onClick={() => handleOpenStatusDialog(u, 'LOCK')}
                              className="h-8 px-2 rounded-lg text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              title={isSelf ? 'Không thể tự khoá tài khoản của chính mình' : 'Khoá tài khoản'}
                              aria-label="Khoá tài khoản"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenStatusDialog(u, 'ACTIVATE')}
                              className="h-8 px-2 rounded-lg text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 cursor-pointer"
                              title="Kích hoạt lại tài khoản"
                              aria-label="Kích hoạt lại tài khoản"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="p-4 border-t border-border/80 bg-secondary/15">
          <AdminPagination
            page={page}
            pageSize={pageSize}
            total={total}
            totalPages={totalPages}
            itemLabel="người dùng"
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(ps) => {
              setPageSize(ps)
              setPage(1)
            }}
          />
        </div>
      </div>

      {/* Lock / Reactivate Dialog */}
      <AdminConfirmDialog
        isOpen={Boolean(statusTarget)}
        title={statusAction === 'LOCK' ? 'Khoá tài khoản người dùng' : 'Kích hoạt lại tài khoản người dùng'}
        targetName={statusTarget ? `${statusTarget.fullName} (${statusTarget.email})` : ''}
        description={
          statusAction === 'LOCK'
            ? 'Bạn chuẩn bị chuyển trạng thái tài khoản sang LOCKED (Đã khoá). Người dùng sẽ không thể đăng nhập để đặt vé.'
            : 'Bạn chuẩn bị khôi phục tài khoản sang ACTIVE. Người dùng có thể đăng nhập lại bình thường.'
        }
        consequenceWarning={
          statusAction === 'LOCK'
            ? 'Mọi phiên đăng nhập hiện tại của người dùng sẽ bị thu hồi; access token đang dùng sẽ hết hạn trong tối đa 15 phút.'
            : undefined
        }
        confirmText={statusAction === 'LOCK' ? 'Xác nhận khoá' : 'Kích hoạt lại'}
        cancelText="Hủy bỏ"
        variant={statusAction === 'LOCK' ? 'destructive' : 'default'}
        isLoading={isUpdatingStatus}
        onConfirm={() => void handleConfirmStatusChange()}
        onCancel={() => setStatusTarget(null)}
      />
    </div>
  )
}
