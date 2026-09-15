import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ChevronLeft,
  Copy,
  Check,
  Ban,
  User,
  ShieldCheck,
  UserCheck,
  UserX,
  Sparkles,
  Ticket,
  History,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react'
import type {
  AdminUser,
  AdminUserRole,
  AdminUserStatus,
} from '@/types/admin-user'
import {
  getAdminUserById,
  updateUserStatus,
  updateUserRoles,
} from '@/mocks/admin/users'
import { useAuth } from '@/context/auth-context'
import { AdminStatusBadge } from '@/components/admin/common/admin-status-badge'
import { AdminConfirmDialog } from '@/components/admin/common/admin-confirm-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

export default function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>()
  const { user: currentUser } = useAuth()

  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Role edit state
  const [isEditingRoles, setIsEditingRoles] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<AdminUserRole[]>([])
  const [showRoleConfirmDialog, setShowRoleConfirmDialog] = useState(false)
  const [roleReason, setRoleReason] = useState('')
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)

  // Status edit state
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [targetStatus, setTargetStatus] = useState<AdminUserStatus>('ACTIVE')
  const [statusReason, setStatusReason] = useState('')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    try {
      const data = getAdminUserById(userId)
      setUser(data)
      if (data) {
        setSelectedRoles(data.roles)
      }
    } catch (err) {
      console.error('Failed to load user detail:', err)
      toast.error('Không thể tải chi tiết người dùng')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(label)
    toast.success(`Đã sao chép ${label}`)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const isSelf = Boolean(currentUser && user && currentUser.id === user.id)

  // Role toggle
  const handleToggleRole = (role: AdminUserRole) => {
    if (isSelf && role === 'ADMIN' && selectedRoles.includes('ADMIN')) {
      toast.warning('Bạn không thể tự gỡ quyền Quản trị viên của chính mình.')
      return
    }

    if (selectedRoles.includes(role)) {
      if (selectedRoles.length === 1) {
        toast.warning('Người dùng phải có ít nhất một vai trò.')
        return
      }
      setSelectedRoles(selectedRoles.filter((r) => r !== role))
    } else {
      setSelectedRoles([...selectedRoles, role])
    }
  }

  const handleSaveRoles = () => {
    if (!user) return
    setShowRoleConfirmDialog(true)
  }

  const handleConfirmRoleChange = () => {
    if (!user) return
    setIsUpdatingRole(true)
    const actorName = currentUser?.fullName ? `${currentUser.fullName} (Admin)` : 'Admin'

    try {
      const res = updateUserRoles(user.id, selectedRoles, roleReason, actorName)
      if (res.success && res.user) {
        setUser(res.user)
        setIsEditingRoles(false)
        setShowRoleConfirmDialog(false)
        setRoleReason('')
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error('Có lỗi xảy ra khi cập nhật vai trò')
    } finally {
      setIsUpdatingRole(false)
    }
  }

  // Status toggle
  const handleOpenStatusModal = (newStatus: AdminUserStatus) => {
    if (isSelf && (newStatus === 'SUSPENDED' || newStatus === 'LOCKED')) {
      toast.error('Bạn không thể tự khóa tài khoản của chính mình.')
      return
    }
    setTargetStatus(newStatus)
    setStatusReason('')
    setShowStatusDialog(true)
  }

  const handleConfirmStatusChange = () => {
    if (!user) return
    setIsUpdatingStatus(true)
    const actorName = currentUser?.fullName ? `${currentUser.fullName} (Admin)` : 'Admin'

    try {
      const res = updateUserStatus(user.id, targetStatus, statusReason, actorName)
      if (res.success && res.user) {
        setUser(res.user)
        setShowStatusDialog(false)
        setStatusReason('')
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-secondary/50 rounded-xl" />
        <div className="h-24 w-full bg-secondary/30 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-secondary/20 rounded-2xl" />
          <div className="h-96 bg-secondary/20 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card/60 p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto">
          <Ban className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Không tìm thấy người dùng</h2>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Mã tài khoản &quot;{userId}&quot; không tồn tại hoặc đã bị xóa khỏi hệ thống.
        </p>
        <Button asChild variant="outline" size="sm" className="rounded-xl">
          <Link to="/admin/users">Quay lại danh sách</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-8 px-2 rounded-lg text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <Link to="/admin/users">
                <ChevronLeft className="w-4 h-4 mr-1" />
                <span>Danh sách người dùng</span>
              </Link>
            </Button>
            <span className="text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground font-mono">
              ID: {user.id}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-foreground flex items-center gap-2">
              <User className="w-6 h-6 text-primary" />
              <span>{user.fullName}</span>
            </h1>

            {isSelf && (
              <Badge variant="default" className="text-[10px] font-bold">
                Tài khoản của bạn
              </Badge>
            )}

            <button
              type="button"
              onClick={() => copyToClipboard(user.id, 'User ID')}
              className="p-1.5 rounded-lg border border-border/80 bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Sao chép mã người dùng"
            >
              {copiedKey === 'User ID' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            <AdminStatusBadge status={user.status} size="md" />

            <div className="flex items-center gap-1.5">
              {user.roles.map((r) => (
                <span
                  key={r}
                  className={cn(
                    'px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold uppercase border',
                    r === 'ADMIN'
                      ? 'bg-primary/15 text-primary border-primary/30'
                      : 'bg-secondary text-secondary-foreground border-border/80'
                  )}
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Top Status Toggle Actions */}
        <div className="flex items-center gap-2.5">
          {user.status === 'ACTIVE' ? (
            <div className="relative group">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSelf}
                onClick={() => handleOpenStatusModal('SUSPENDED')}
                className="h-9 gap-1.5 rounded-xl border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-bold"
              >
                <UserX className="w-4 h-4" />
                <span>Tạm đình chỉ tài khoản</span>
              </Button>
              {isSelf && (
                <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block z-20 w-64 p-2 rounded-xl bg-popover border border-border/80 text-[11px] text-muted-foreground shadow-xl">
                  Bạn không thể tự đình chỉ tài khoản của chính mình.
                </div>
              )}
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenStatusModal('ACTIVE')}
              className="h-9 gap-1.5 rounded-xl border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 cursor-pointer font-bold"
            >
              <UserCheck className="w-4 h-4" />
              <span>Kích hoạt lại tài khoản</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Profile Info & Role Assignment (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Profile Overview Card */}
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-5 shadow-xs space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b border-border/60 pb-3">
              <User className="w-4 h-4 text-primary" />
              <span>Hồ sơ người dùng</span>
            </h2>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-20 h-20 rounded-2xl object-cover border border-border/80 shadow-md shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center font-black text-primary text-2xl shrink-0">
                  {user.fullName.charAt(0)}
                </div>
              )}

              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="text-lg font-black font-heading text-foreground">
                    {user.fullName}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold border uppercase tracking-wider bg-purple-500/15 text-purple-300 border-purple-500/30">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    {user.tier}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-secondary/30 p-3 rounded-xl border border-border/50">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Email liên hệ:</span>
                    <span className="font-bold text-foreground block truncate">{user.email}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Số điện thoại:</span>
                    <span className="font-mono font-bold text-foreground block">{user.phone}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Ngày tham gia:</span>
                    <span className="font-mono text-muted-foreground block">{user.joinedAt}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Lần đăng nhập cuối:</span>
                    <span className="font-mono text-muted-foreground block">{user.lastLogin}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics Chips */}
            <div className="grid grid-cols-3 gap-3 border-t border-border/60 pt-4">
              <div className="p-3 rounded-xl bg-secondary/20 border border-border/50 text-center">
                <span className="text-[11px] text-muted-foreground block">Điểm tích lũy</span>
                <span className="text-base font-black font-heading font-mono text-foreground">
                  {user.points.toLocaleString('vi-VN')}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-secondary/20 border border-border/50 text-center">
                <span className="text-[11px] text-muted-foreground block">Tổng chi tiêu</span>
                <span className="text-base font-black font-heading font-mono text-primary">
                  {formatVND(user.totalSpent)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-secondary/20 border border-border/50 text-center">
                <span className="text-[11px] text-muted-foreground block">Số vé đã đặt</span>
                <span className="text-base font-black font-heading font-mono text-foreground">
                  {user.bookingCount} vé
                </span>
              </div>
            </div>
          </div>

          {/* Role & Privileges Management Card */}
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Phân quyền tài khoản (Role Assignment)</span>
              </h2>

              {!isEditingRoles ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingRoles(true)}
                  className="h-8 rounded-xl text-xs font-bold border-border/80 hover:bg-secondary cursor-pointer"
                >
                  Chỉnh sửa quyền
                </Button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingRoles(false)
                      setSelectedRoles(user.roles)
                    }}
                    className="h-8 rounded-xl text-xs cursor-pointer"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveRoles}
                    className="h-8 rounded-xl text-xs font-bold gap-1 cursor-pointer bg-primary text-primary-foreground shadow-xs"
                  >
                    <span>Lưu phân quyền</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Role Options */}
            <div className="space-y-3">
              {/* ROLE_ADMIN Option */}
              <div
                className={cn(
                  'p-4 rounded-xl border transition-all',
                  selectedRoles.includes('ADMIN')
                    ? 'border-primary/50 bg-primary/10'
                    : 'border-border/60 bg-secondary/20 opacity-80'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        ROLE_ADMIN (Quản trị viên)
                      </span>
                      {selectedRoles.includes('ADMIN') && (
                        <Badge variant="default" className="text-[10px]">
                          Đang cấp quyền
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Toàn quyền truy cập bảng điều khiển Admin Console: Quản lý phim, cụm rạp, phòng chiếu, sơ đồ ghế, suất chiếu, vé, thanh toán và người dùng.
                    </p>
                  </div>

                  {isEditingRoles && (
                    <div className="shrink-0 pt-0.5">
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes('ADMIN')}
                        onChange={() => handleToggleRole('ADMIN')}
                        disabled={isSelf && selectedRoles.includes('ADMIN')}
                        className="w-4 h-4 rounded border-border accent-primary cursor-pointer disabled:cursor-not-allowed"
                        title={
                          isSelf && selectedRoles.includes('ADMIN')
                            ? 'Bạn không thể tự gỡ quyền Quản trị viên của chính mình'
                            : undefined
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Self Lockout Warning Callout */}
                {isSelf && isEditingRoles && (
                  <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-400 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>
                      Cơ chế bảo vệ: Không thể tự thu hồi quyền <strong>ROLE_ADMIN</strong> của chính tài khoản đang đăng nhập để tránh khóa hệ thống.
                    </span>
                  </div>
                )}
              </div>

              {/* ROLE_USER Option */}
              <div
                className={cn(
                  'p-4 rounded-xl border transition-all',
                  selectedRoles.includes('USER')
                    ? 'border-border/80 bg-secondary/30'
                    : 'border-border/60 bg-secondary/10 opacity-70'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        ROLE_USER (Khách hàng tiêu chuẩn)
                      </span>
                      {selectedRoles.includes('USER') && (
                        <Badge variant="secondary" className="text-[10px]">
                          Mặc định
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Quyền xem lịch chiếu phim, giữ chỗ chọn ghế, thanh toán trực tuyến, xem vé điện tử và quản lý hồ sơ cá nhân.
                    </p>
                  </div>

                  {isEditingRoles && (
                    <div className="shrink-0 pt-0.5">
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes('USER')}
                        onChange={() => handleToggleRole('USER')}
                        className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Linked Bookings Recent Table */}
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Ticket className="w-4 h-4 text-primary" />
                <span>Đơn đặt vé gần đây của khách hàng</span>
              </h2>
              <span className="text-xs text-muted-foreground font-mono">
                {user.recentBookings?.length || 0} đơn
              </span>
            </div>

            {user.recentBookings && user.recentBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 text-muted-foreground font-medium text-[11px]">
                      <th className="py-2.5 pl-1 pr-3">Mã Đơn</th>
                      <th className="py-2.5 px-3">Phim</th>
                      <th className="py-2.5 px-3">Suất Chiếu</th>
                      <th className="py-2.5 px-3 text-right">Tổng Tiền</th>
                      <th className="py-2.5 px-3">Trạng Thái</th>
                      <th className="py-2.5 pr-1 pl-3 text-center">Chi Tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {user.recentBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-2.5 pl-1 pr-3 font-mono font-bold text-foreground">
                          {b.bookingCode}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-foreground max-w-[140px] truncate">
                          {b.movieTitle}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">
                          {b.showtime}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                          {formatVND(b.finalTotal)}
                        </td>
                        <td className="py-2.5 px-3">
                          <AdminStatusBadge status={b.status} size="sm" />
                        </td>
                        <td className="py-2.5 pr-1 pl-3 text-center">
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-primary hover:underline cursor-pointer"
                          >
                            <Link to={`/admin/bookings/${b.id}`}>
                              <span>Xem</span>
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Khách hàng này chưa có đơn đặt vé nào trong hệ thống.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Audit Trail (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Audit Trail Card */}
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-400" />
                <span>Nhật ký kiểm toán (Audit Trail)</span>
              </h2>
              <span className="text-xs text-muted-foreground font-mono">
                {user.auditLogs.length} sự kiện
              </span>
            </div>

            {user.auditLogs.length > 0 ? (
              <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/80">
                {user.auditLogs.map((log) => (
                  <div key={log.id} className="relative space-y-1">
                    {/* Event dot */}
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center bg-card">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="text-xs font-bold text-foreground">
                        {log.description}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {log.timestamp}
                      </span>
                    </div>

                    <div className="text-[11px] text-muted-foreground space-y-0.5">
                      <div>
                        Người thực hiện: <strong className="text-foreground">{log.actor}</strong>
                      </div>
                      <div className="font-mono text-[10px] bg-secondary/30 px-2 py-1 rounded border border-border/40">
                        {log.previousValue} → <span className="text-primary font-bold">{log.newValue}</span>
                      </div>
                      {log.reason && (
                        <div className="italic text-[11px] text-muted-foreground pt-0.5">
                          Lý do: &quot;{log.reason}&quot;
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Tài khoản này chưa có ghi nhận thay đổi vai trò hoặc trạng thái nào.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Role Change Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={showRoleConfirmDialog}
        title="Xác nhận thay đổi phân quyền"
        targetName={user.fullName}
        description={`Bạn chuẩn bị thay đổi vai trò của người dùng sang: [${selectedRoles.join(', ')}].`}
        consequenceWarning="Thao tác này sẽ cập nhật trực tiếp quyền hạn truy cập của người dùng trong toàn bộ các microservices và được lưu vĩnh viễn vào nhật ký kiểm toán (Audit Trail)."
        confirmText="Xác nhận cấp quyền"
        cancelText="Hủy bỏ"
        variant="warning"
        isLoading={isUpdatingRole}
        onConfirm={handleConfirmRoleChange}
        onCancel={() => {
          setShowRoleConfirmDialog(false)
          setRoleReason('')
        }}
      />

      {/* Status Change Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={showStatusDialog}
        title={targetStatus === 'ACTIVE' ? 'Kích hoạt lại tài khoản' : 'Đình chỉ tài khoản'}
        targetName={user.fullName}
        description={
          targetStatus === 'ACTIVE'
            ? 'Khôi phục trạng thái hoạt động bình thường cho tài khoản này.'
            : 'Đình chỉ tài khoản này. Người dùng sẽ bị chặn đăng nhập và hủy các phiên làm việc hiện hành.'
        }
        consequenceWarning={
          targetStatus !== 'ACTIVE'
            ? 'Mọi hành vi đăng nhập hoặc đặt vé từ tài khoản này sẽ bị từ chối ngay lập tức.'
            : undefined
        }
        confirmText={targetStatus === 'ACTIVE' ? 'Kích hoạt lại' : 'Đình chỉ'}
        cancelText="Đóng"
        variant={targetStatus === 'ACTIVE' ? 'default' : 'destructive'}
        isLoading={isUpdatingStatus}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => {
          setShowStatusDialog(false)
          setStatusReason('')
        }}
      />
    </div>
  )
}
