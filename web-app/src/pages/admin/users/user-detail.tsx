import { useState, useEffect, useCallback } from 'react'
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
  Ticket,
  ExternalLink,
  ShieldAlert,
  Info,
} from 'lucide-react'
import type { AdminUser, AdminUserRole, AdminUserStatus } from '@/types/admin-user'
import type { BackendBookingResponse } from '@/types/booking'
import { adminBookingApi, adminUserApi } from '@/services/admin-api.service'
import { ApiClientError } from '@/lib/api-client'
import { useAuth } from '@/context/auth-context'
import { AdminStatusBadge } from '@/components/admin/common/admin-status-badge'
import { AdminConfirmDialog } from '@/components/admin/common/admin-confirm-dialog'
import { UserInitialsAvatar } from '@/components/admin/users/user-initials-avatar'
import {
  USER_STATUS_LABEL,
  errorMessage,
  formatDateTime,
  formatVND,
} from '@/components/admin/users/user-utils'
import { PageErrorState } from '@/components/ui/page-error-state'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

const RECENT_BOOKINGS_LIMIT = 5

export default function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>()
  const { user: currentUser } = useAuth()

  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Recent bookings
  const [bookings, setBookings] = useState<BackendBookingResponse[]>([])
  const [bookingTotal, setBookingTotal] = useState(0)
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [bookingsError, setBookingsError] = useState<string | null>(null)

  // Role edit state
  const [isEditingRoles, setIsEditingRoles] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<AdminUserRole[]>([])
  const [showRoleConfirmDialog, setShowRoleConfirmDialog] = useState(false)
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)

  // Status edit state
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [targetStatus, setTargetStatus] = useState<AdminUserStatus>('ACTIVE')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const loadUser = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setNotFound(false)
    setLoadError(null)
    try {
      const data = await adminUserApi.get(userId)
      setUser(data)
      setSelectedRoles(data.roles)
    } catch (err) {
      setUser(null)
      if (err instanceof ApiClientError && err.status === 404) {
        setNotFound(true)
      } else {
        setLoadError(errorMessage(err, 'Không thể tải chi tiết người dùng'))
      }
    } finally {
      setLoading(false)
    }
  }, [userId])

  const loadBookings = useCallback(async () => {
    if (!userId) return
    setBookingsLoading(true)
    setBookingsError(null)
    try {
      const res = await adminBookingApi.list({ userId, pageSize: RECENT_BOOKINGS_LIMIT })
      setBookings(res.items)
      setBookingTotal(res.total)
    } catch (err) {
      setBookings([])
      setBookingsError(errorMessage(err, 'Không thể tải đơn đặt vé của người dùng'))
    } finally {
      setBookingsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void loadUser()
    void loadBookings()
  }, [loadUser, loadBookings])

  const copyToClipboard = (text: string, label: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedKey(label)
    toast.success(`Đã sao chép ${label}`)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const isSelf = Boolean(currentUser && user && currentUser.id === user.id)

  // Chỉ bật/tắt ADMIN; USER luôn được giữ (backend tự thêm lại)
  const handleToggleAdmin = () => {
    if (isSelf && selectedRoles.includes('ADMIN')) {
      toast.warning('Bạn không thể tự gỡ quyền Quản trị viên của chính mình.')
      return
    }
    setSelectedRoles(
      selectedRoles.includes('ADMIN') ? ['USER'] : ['USER', 'ADMIN']
    )
  }

  const rolesChanged =
    user !== null &&
    (selectedRoles.length !== user.roles.length || selectedRoles.some((r) => !user.roles.includes(r)))

  const handleConfirmRoleChange = async () => {
    if (!user) return
    setIsUpdatingRole(true)
    try {
      const updated = await adminUserApi.updateRoles(user.id, selectedRoles)
      setUser(updated)
      setSelectedRoles(updated.roles)
      setIsEditingRoles(false)
      setShowRoleConfirmDialog(false)
      toast.success('Đã cập nhật phân quyền. Thay đổi có hiệu lực khi người dùng làm mới phiên (tối đa 15 phút).')
    } catch (err) {
      toast.error(errorMessage(err, 'Có lỗi xảy ra khi cập nhật vai trò'))
    } finally {
      setIsUpdatingRole(false)
    }
  }

  const handleOpenStatusModal = (newStatus: AdminUserStatus) => {
    if (isSelf && newStatus === 'LOCKED') {
      toast.error('Bạn không thể tự khoá tài khoản của chính mình.')
      return
    }
    setTargetStatus(newStatus)
    setShowStatusDialog(true)
  }

  const handleConfirmStatusChange = async () => {
    if (!user) return
    setIsUpdatingStatus(true)
    try {
      const updated = await adminUserApi.updateStatus(user.id, targetStatus)
      setUser(updated)
      setShowStatusDialog(false)
      toast.success(
        targetStatus === 'LOCKED' ? 'Đã khoá tài khoản người dùng' : 'Đã kích hoạt lại tài khoản người dùng'
      )
    } catch (err) {
      toast.error(errorMessage(err, 'Có lỗi xảy ra khi cập nhật trạng thái'))
    } finally {
      setIsUpdatingStatus(false)
    }
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

  if (loadError) {
    return (
      <PageErrorState
        title="Không thể tải chi tiết người dùng"
        message={loadError}
        onRetry={() => void loadUser()}
      />
    )
  }

  if (!user || notFound) {
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

  const isLocked = user.status === 'LOCKED'

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
            <span className="text-xs text-muted-foreground font-mono">ID: {user.id}</span>
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
              aria-label="Sao chép mã người dùng"
            >
              {copiedKey === 'User ID' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            {user.status && (
              <AdminStatusBadge status={user.status} label={USER_STATUS_LABEL[user.status]} size="md" />
            )}

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
          {!isLocked ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSelf}
              onClick={() => handleOpenStatusModal('LOCKED')}
              className="h-9 gap-1.5 rounded-xl border-rose-500/30 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-bold"
              title={isSelf ? 'Bạn không thể tự khoá tài khoản của chính mình' : undefined}
            >
              <UserX className="w-4 h-4" />
              <span>Khoá tài khoản</span>
            </Button>
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
        {/* LEFT COLUMN: Profile Info & Role Assignment */}
        <div className="lg:col-span-5 space-y-6">
          {/* Profile Overview Card */}
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-5 shadow-xs space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b border-border/60 pb-3">
              <User className="w-4 h-4 text-primary" />
              <span>Hồ sơ người dùng</span>
            </h2>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              <UserInitialsAvatar name={user.fullName} className="w-20 h-20 rounded-2xl text-2xl" />

              <div className="space-y-2 flex-1 min-w-0">
                <span className="text-lg font-black font-heading text-foreground block">{user.fullName}</span>

                <div className="grid grid-cols-1 gap-3 text-xs bg-secondary/30 p-3 rounded-xl border border-border/50 text-left">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Email liên hệ:</span>
                    <span className="font-bold text-foreground block truncate">{user.email}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Số điện thoại:</span>
                    <span className="font-mono font-bold text-foreground block">{user.phone || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Ngày tạo tài khoản:</span>
                    <span className="font-mono text-muted-foreground block">{formatDateTime(user.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-border/60 pt-4">
              <div className="p-3 rounded-xl bg-secondary/20 border border-border/50 text-center">
                <span className="text-[11px] text-muted-foreground block">Số đơn đặt vé</span>
                <span className="text-base font-black font-heading font-mono text-foreground">
                  {bookingsLoading ? '…' : bookingsError ? '—' : `${bookingTotal} đơn`}
                </span>
              </div>
            </div>
          </div>

          {/* Role & Privileges Management Card */}
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Phân quyền tài khoản</span>
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
                    disabled={!rolesChanged}
                    onClick={() => setShowRoleConfirmDialog(true)}
                    className="h-8 rounded-xl text-xs font-bold gap-1 cursor-pointer bg-primary text-primary-foreground shadow-xs"
                  >
                    <span>Lưu phân quyền</span>
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {/* ADMIN */}
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
                      <span className="text-xs font-bold text-foreground">ADMIN (Quản trị viên)</span>
                      {selectedRoles.includes('ADMIN') && (
                        <Badge variant="default" className="text-[10px]">
                          Đang cấp quyền
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Toàn quyền truy cập trang quản trị: phim, rạp, phòng chiếu, suất chiếu, đơn đặt vé, thanh toán và người dùng.
                    </p>
                  </div>

                  {isEditingRoles && (
                    <div className="shrink-0 pt-0.5">
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes('ADMIN')}
                        onChange={handleToggleAdmin}
                        disabled={isSelf && selectedRoles.includes('ADMIN')}
                        aria-label="Cấp quyền Quản trị viên"
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

                {isSelf && isEditingRoles && (
                  <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-400 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>
                      Cơ chế bảo vệ: Không thể tự thu hồi quyền <strong>ADMIN</strong> của chính tài khoản đang đăng nhập.
                    </span>
                  </div>
                )}
              </div>

              {/* USER (luôn giữ) */}
              <div className="p-4 rounded-xl border border-border/80 bg-secondary/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">USER (Khách hàng)</span>
                      <Badge variant="secondary" className="text-[10px]">
                        Luôn có
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Quyền xem lịch chiếu, giữ ghế, thanh toán, xem vé điện tử và quản lý hồ sơ cá nhân. Mọi tài khoản đều có vai trò này.
                    </p>
                  </div>
                  {isEditingRoles && (
                    <div className="shrink-0 pt-0.5">
                      <input
                        type="checkbox"
                        checked
                        disabled
                        readOnly
                        aria-label="Vai trò USER (luôn có)"
                        className="w-4 h-4 rounded border-border accent-primary cursor-not-allowed"
                      />
                    </div>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Thay đổi vai trò có hiệu lực khi người dùng làm mới phiên đăng nhập (tối đa 15 phút).</span>
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Recent bookings */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Ticket className="w-4 h-4 text-primary" />
                <span>Đơn đặt vé gần đây</span>
              </h2>
              <span className="text-xs text-muted-foreground font-mono">
                {bookingsLoading ? '' : `${bookings.length}/${bookingTotal} đơn`}
              </span>
            </div>

            {bookingsLoading ? (
              <div className="space-y-2 animate-pulse">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-9 rounded-lg bg-secondary/30" />
                ))}
              </div>
            ) : bookingsError ? (
              <PageErrorState
                title="Không thể tải đơn đặt vé"
                message={bookingsError}
                onRetry={() => void loadBookings()}
              />
            ) : bookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 text-muted-foreground font-medium text-[11px]">
                      <th className="py-2.5 pl-1 pr-3">Mã Đơn</th>
                      <th className="py-2.5 px-3">Phim</th>
                      <th className="py-2.5 px-3">Suất Chiếu</th>
                      <th className="py-2.5 px-3 text-right">Tổng Tiền</th>
                      <th className="py-2.5 px-3">Trạng Thái</th>
                      <th className="py-2.5 px-3">Ngày Đặt</th>
                      <th className="py-2.5 pr-1 pl-3 text-center">Chi Tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-2.5 pl-1 pr-3 font-mono font-bold text-foreground">{b.bookingCode}</td>
                        <td className="py-2.5 px-3 font-medium text-foreground max-w-[140px] truncate">
                          {b.movieTitle || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">
                          {formatDateTime(b.showtimeStart)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                          {formatVND(b.totalAmount)}
                        </td>
                        <td className="py-2.5 px-3">
                          <AdminStatusBadge status={b.status} size="sm" />
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">
                          {formatDateTime(b.createdAt)}
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
      </div>

      {/* Role Change Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={showRoleConfirmDialog}
        title="Xác nhận thay đổi phân quyền"
        targetName={user.fullName}
        description={`Bạn chuẩn bị thay đổi vai trò của người dùng sang: [${selectedRoles.join(', ')}].`}
        consequenceWarning="Quyền mới có hiệu lực khi người dùng làm mới phiên đăng nhập (tối đa 15 phút); access token hiện tại vẫn giữ quyền cũ cho đến khi hết hạn."
        confirmText="Xác nhận"
        cancelText="Hủy bỏ"
        variant="warning"
        isLoading={isUpdatingRole}
        onConfirm={() => void handleConfirmRoleChange()}
        onCancel={() => setShowRoleConfirmDialog(false)}
      />

      {/* Status Change Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={showStatusDialog}
        title={targetStatus === 'ACTIVE' ? 'Kích hoạt lại tài khoản' : 'Khoá tài khoản'}
        targetName={user.fullName}
        description={
          targetStatus === 'ACTIVE'
            ? 'Khôi phục trạng thái hoạt động bình thường cho tài khoản này.'
            : 'Khoá tài khoản này (LOCKED). Người dùng sẽ không thể đăng nhập.'
        }
        consequenceWarning={
          targetStatus === 'LOCKED'
            ? 'Mọi phiên đăng nhập hiện tại của người dùng sẽ bị thu hồi; access token đang dùng sẽ hết hạn trong tối đa 15 phút.'
            : undefined
        }
        confirmText={targetStatus === 'ACTIVE' ? 'Kích hoạt lại' : 'Khoá tài khoản'}
        cancelText="Đóng"
        variant={targetStatus === 'ACTIVE' ? 'default' : 'destructive'}
        isLoading={isUpdatingStatus}
        onConfirm={() => void handleConfirmStatusChange()}
        onCancel={() => setShowStatusDialog(false)}
      />
    </div>
  )
}
