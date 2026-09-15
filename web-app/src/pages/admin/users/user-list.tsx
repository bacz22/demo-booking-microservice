import { useState, useEffect, useMemo, useCallback } from 'react'
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
  Sparkles,
} from 'lucide-react'
import type {
  AdminUser,
  AdminUserRole,
  AdminUserStatus,
  MembershipTier,
  UserFilterState,
} from '@/types/admin-user'
import {
  getAdminUsers,
  getUserSummary,
  updateUserStatus,
  exportUsersToCSV,
} from '@/mocks/admin/users'
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

export default function AdminUserList() {
  const { user: currentUser } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  // Filters from query params
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [role, setRole] = useState<string>(searchParams.get('role') || 'ALL')
  const [status, setStatus] = useState<string>(searchParams.get('status') || 'ALL')
  const [tier, setTier] = useState<string>(searchParams.get('tier') || 'ALL')
  const [page, setPage] = useState<number>(Number(searchParams.get('page')) || 1)
  const [pageSize, setPageSize] = useState<number>(Number(searchParams.get('pageSize')) || 10)

  // Data states
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Suspend/Reactivate Dialog
  const [statusTarget, setStatusTarget] = useState<AdminUser | null>(null)
  const [statusAction, setStatusAction] = useState<'SUSPEND' | 'ACTIVATE'>('SUSPEND')
  const [statusReason, setStatusReason] = useState('')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Sync state with URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (role !== 'ALL') params.set('role', role)
    if (status !== 'ALL') params.set('status', status)
    if (tier !== 'ALL') params.set('tier', tier)
    if (page > 1) params.set('page', String(page))
    if (pageSize !== 10) params.set('pageSize', String(pageSize))

    setSearchParams(params, { replace: true })
  }, [search, role, status, tier, page, pageSize, setSearchParams])

  // Fetch users
  const fetchUsers = useCallback(() => {
    setLoading(true)
    try {
      const filters: Partial<UserFilterState> = {
        search,
        role: role as 'ALL' | AdminUserRole,
        status: status as 'ALL' | AdminUserStatus,
        tier: tier as 'ALL' | MembershipTier,
        page,
        pageSize,
      }

      const result = getAdminUsers(filters)
      setUsers(result.data)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (err) {
      console.error('Failed to load users:', err)
      toast.error('Không thể tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }, [search, role, status, tier, page, pageSize])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // KPI Summary
  const summary = useMemo(() => {
    void total
    return getUserSummary()
  }, [total])

  const isFiltered =
    Boolean(search) ||
    role !== 'ALL' ||
    status !== 'ALL' ||
    tier !== 'ALL'

  const handleResetFilters = () => {
    setSearch('')
    setRole('ALL')
    setStatus('ALL')
    setTier('ALL')
    setPage(1)
  }

  const handleExportCSV = () => {
    const result = getAdminUsers({
      search,
      role: role as 'ALL' | AdminUserRole,
      status: status as 'ALL' | AdminUserStatus,
      tier: tier as 'ALL' | MembershipTier,
      pageSize: 9999,
    })

    if (result.data.length === 0) {
      toast.warning('Không có dữ liệu người dùng phù hợp để xuất file')
      return
    }

    exportUsersToCSV(result.data)
    toast.success(`Đã xuất ${result.data.length} tài khoản người dùng ra file CSV`)
  }

  // Handle Suspend or Reactivate
  const handleOpenStatusDialog = (target: AdminUser, action: 'SUSPEND' | 'ACTIVATE') => {
    // Self-lockout check
    if (currentUser && currentUser.id === target.id && action === 'SUSPEND') {
      toast.error('Bạn không thể tự đình chỉ tài khoản của chính mình.')
      return
    }

    setStatusTarget(target)
    setStatusAction(action)
    setStatusReason('')
  }

  const handleConfirmStatusChange = () => {
    if (!statusTarget) return
    setIsUpdatingStatus(true)

    const newStatus: AdminUserStatus = statusAction === 'SUSPEND' ? 'SUSPENDED' : 'ACTIVE'
    const actorName = currentUser?.fullName ? `${currentUser.fullName} (Admin)` : 'Admin'

    try {
      const res = updateUserStatus(statusTarget.id, newStatus, statusReason, actorName)
      if (res.success) {
        toast.success(res.message)
        setStatusTarget(null)
        setStatusReason('')
        fetchUsers()
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái người dùng')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const getTierColor = (userTier: string) => {
    switch (userTier) {
      case 'DIAMOND':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30'
      case 'GOLD':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      case 'SILVER':
        return 'bg-slate-400/15 text-slate-300 border-slate-400/30'
      default:
        return 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="Quản Lý Người Dùng & Role"
        description="Kiểm soát danh sách tài khoản khách hàng, phân quyền Quản trị viên (ROLE_ADMIN) và lưu vết kiểm toán hệ thống"
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
              onClick={handleExportCSV}
              className="h-9 gap-2 rounded-xl border-border/80 bg-secondary/40 font-bold hover:bg-secondary cursor-pointer shadow-xs"
              title="Tải toàn bộ kết quả lọc ra file CSV UTF-8"
            >
              <Download className="w-4 h-4 text-primary" />
              <span>Xuất CSV ({total})</span>
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
              {summary.totalUsers}
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
              {summary.adminCount}
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
              {summary.activeCount}
            </span>
            <span className="text-xs text-emerald-400 font-bold">
              {summary.totalUsers > 0
                ? `${Math.round((summary.activeCount / summary.totalUsers) * 100)}%`
                : '0%'}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Tạm đình chỉ / Khóa</span>
            <UserX className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-heading tracking-tight text-rose-400 font-mono tabular-nums">
              {summary.suspendedCount}
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
                <SelectItem value="SUSPENDED">Tạm đình chỉ (SUSPENDED)</SelectItem>
                <SelectItem value="LOCKED">Đã khóa (LOCKED)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Membership Tier Filter */}
          <div className="sm:col-span-1 lg:col-span-2">
            <Select
              value={tier}
              onValueChange={(val) => {
                setTier(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-10 rounded-xl bg-secondary/40 border-border/80 text-xs font-medium">
                <SelectValue placeholder="Hạng hội viên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả hạng thẻ</SelectItem>
                <SelectItem value="DIAMOND">Kim cương (DIAMOND)</SelectItem>
                <SelectItem value="GOLD">Vàng (GOLD)</SelectItem>
                <SelectItem value="SILVER">Bạc (SILVER)</SelectItem>
                <SelectItem value="MEMBER">Thành viên (MEMBER)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset button */}
          <div className="sm:col-span-1 lg:col-span-1 flex justify-end">
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
                  Hạng Thẻ
                </th>
                <th scope="col" className="py-3.5 px-3 text-right">
                  Điểm Tích Lũy
                </th>
                <th scope="col" className="py-3.5 px-3">
                  Trạng Thái
                </th>
                <th scope="col" className="py-3.5 px-3">
                  Ngày Tham Gia
                </th>
                <th scope="col" className="py-3.5 px-3">
                  Đăng Nhập Cuối
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
                      <Skeleton className="h-5 w-20 rounded" />
                    </td>
                    <td className="py-4 px-3 text-right">
                      <Skeleton className="h-4 w-12 rounded ml-auto" />
                    </td>
                    <td className="py-4 px-3">
                      <Skeleton className="h-6 w-20 rounded-lg" />
                    </td>
                    <td className="py-4 px-3">
                      <Skeleton className="h-4 w-24 rounded" />
                    </td>
                    <td className="py-4 px-3">
                      <Skeleton className="h-4 w-24 rounded" />
                    </td>
                    <td className="py-4 pr-4 pl-3 text-center">
                      <Skeleton className="h-8 w-20 rounded-lg mx-auto" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
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
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt={u.fullName}
                              className="w-9 h-9 rounded-full object-cover border border-border/80 shrink-0 shadow-2xs"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-black text-primary text-xs shrink-0">
                              {u.fullName.charAt(0)}
                            </div>
                          )}

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
                              {u.phone}
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

                      {/* Tier */}
                      <td className="py-3.5 px-3 align-middle">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-wider',
                            getTierColor(u.tier)
                          )}
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{u.tier}</span>
                        </span>
                      </td>

                      {/* Points */}
                      <td className="py-3.5 px-3 align-middle text-right font-mono">
                        <span className="font-bold text-foreground tabular-nums text-xs">
                          {u.points.toLocaleString('vi-VN')}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-3 align-middle">
                        <AdminStatusBadge status={u.status} size="sm" />
                      </td>

                      {/* Joined At */}
                      <td className="py-3.5 px-3 align-middle text-muted-foreground font-mono text-[11px]">
                        {u.joinedAt}
                      </td>

                      {/* Last Login */}
                      <td className="py-3.5 px-3 align-middle text-muted-foreground font-mono text-[11px]">
                        {u.lastLogin}
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

                          {/* Quick Suspend / Activate button */}
                          {u.status === 'ACTIVE' ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={isSelf}
                              onClick={() => handleOpenStatusDialog(u, 'SUSPEND')}
                              className="h-8 px-2 rounded-lg text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              title={isSelf ? 'Không thể tự đình chỉ tài khoản của chính mình' : 'Tạm đình chỉ tài khoản'}
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

      {/* Suspend / Reactivate Dialog */}
      <AdminConfirmDialog
        isOpen={Boolean(statusTarget)}
        title={statusAction === 'SUSPEND' ? 'Đình chỉ tài khoản người dùng' : 'Kích hoạt lại tài khoản người dùng'}
        targetName={statusTarget ? `${statusTarget.fullName} (${statusTarget.email})` : ''}
        description={
          statusAction === 'SUSPEND'
            ? 'Bạn chuẩn bị chuyển trạng thái tài khoản sang SUSPENDED. Người dùng này sẽ bị đăng xuất và không thể tiếp tục đăng nhập để đặt vé.'
            : 'Bạn chuẩn bị khôi phục tài khoản sang ACTIVE. Người dùng có thể đăng nhập lại bình thường.'
        }
        consequenceWarning={
          statusAction === 'SUSPEND'
            ? 'Thao tác sẽ được ghi vào nhật ký kiểm toán (Audit Trail) của hệ thống cùng với thông tin Quản trị viên thực hiện.'
            : undefined
        }
        confirmText={statusAction === 'SUSPEND' ? 'Xác nhận đình chỉ' : 'Kích hoạt lại'}
        cancelText="Hủy bỏ"
        variant={statusAction === 'SUSPEND' ? 'destructive' : 'default'}
        isLoading={isUpdatingStatus}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => {
          setStatusTarget(null)
          setStatusReason('')
        }}
      />
    </div>
  )
}
