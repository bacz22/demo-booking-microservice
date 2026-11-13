import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Ticket, Shield, Calendar, Mail, LogOut, ArrowRight, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useAuth } from '@/context/auth-context'
import { authApiService } from '@/services/auth-api.service'
import { ApiClientError } from '@/lib/api-client'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

type ProfileTab = 'profile' | 'security'

const ROLE_LABELS: Record<string, string> = { USER: 'Khách hàng', ADMIN: 'Quản trị viên' }

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiClientError) {
    if (err.code === 'INVALID_PASSWORD') return 'Mật khẩu hiện tại không đúng.'
    return err.message || fallback
  }
  return err instanceof Error && err.message ? err.message : fallback
}

function formatJoinDate(value?: string): string {
  if (!value) return ''
  const d = new Date(value)
  return isNaN(d.getTime()) ? value : d.toLocaleDateString('vi-VN')
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout, updateProfile } = useAuth()
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile')

  // Dữ liệu form (khởi tạo từ tài khoản đang đăng nhập)
  const [profileForm, setProfileForm] = useState<{ fullName?: string; phone?: string }>({})
  const fullName = profileForm.fullName ?? user?.fullName ?? ''
  const phone = profileForm.phone ?? user?.phone ?? ''

  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  // State Form đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const [profileErrors, setProfileErrors] = useState<{ fullName?: string; phone?: string }>({})
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string
    newPassword?: string
    confirmPassword?: string
  }>({})

  useEffect(() => {
    document.title = 'Hồ sơ cá nhân | CineBook'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Lưu thông tin cá nhân qua auth-service
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    const errors: { fullName?: string; phone?: string } = {}
    if (!fullName || fullName.trim().length < 2) {
      errors.fullName = 'Họ và tên không được để trống (tối thiểu 2 ký tự).'
    }
    const cleanPhone = phone.replace(/\s+/g, '')
    if (cleanPhone && !/^(0|\+84)[35789][0-9]{8}$/.test(cleanPhone)) {
      errors.phone = 'Số điện thoại không hợp lệ (10 số, vd: 0912 345 678).'
    }
    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors)
      toast.error('Vui lòng kiểm tra lại thông tin có lỗi.')
      return
    }

    setProfileErrors({})
    setIsSavingProfile(true)
    try {
      const updated = await authApiService.updateProfile({
        fullName: fullName.trim(),
        phone: cleanPhone || undefined,
      })
      // updateProfile của context gộp vào user hiện tại và hiển thị thông báo thành công
      updateProfile({ fullName: updated.fullName, phone: updated.phone ?? undefined })
      setProfileForm({})
    } catch (err) {
      toast.error(errorMessage(err, 'Không thể cập nhật hồ sơ. Vui lòng thử lại.'))
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Đổi mật khẩu qua auth-service
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: { currentPassword?: string; newPassword?: string; confirmPassword?: string } = {}

    if (!currentPassword) {
      errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.'
    }
    if (!newPassword) {
      errors.newPassword = 'Vui lòng nhập mật khẩu mới.'
    } else if (newPassword.length < 6) {
      errors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự.'
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận lại mật khẩu mới.'
    } else if (newPassword && newPassword !== confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp.'
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors)
      return
    }

    setPasswordErrors({})
    setIsChangingPassword(true)
    try {
      await authApiService.changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Đổi mật khẩu thành công! Các thiết bị khác đã được đăng xuất.')
    } catch (err) {
      if (err instanceof ApiClientError && err.code === 'INVALID_PASSWORD') {
        setPasswordErrors({ currentPassword: 'Mật khẩu hiện tại không đúng.' })
      }
      toast.error(errorMessage(err, 'Không thể đổi mật khẩu. Vui lòng thử lại.'))
    } finally {
      setIsChangingPassword(false)
    }
  }

  const confirmLogout = () => {
    setLogoutDialogOpen(false)
    logout()
    navigate('/login')
  }

  const tabClass = (tab: ProfileTab) =>
    cn(
      'flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer text-center',
      activeTab === tab
        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
    )

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <section aria-label="Thông tin tài khoản" className="space-y-6">
        <nav aria-label="Đường dẫn trang" className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <span className="text-foreground font-semibold">Tài khoản</span>
        </nav>

        <div className="rounded-3xl border border-border/70 bg-card/85 p-6 sm:p-7 shadow-lg backdrop-blur-md flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-2xl border-2 border-primary/40 bg-primary/10 flex items-center justify-center text-2xl font-black text-primary">
            {(user?.fullName || user?.email || '?').trim().charAt(0).toUpperCase()}
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-black text-foreground truncate">{user?.fullName}</h1>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
              <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="truncate">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {user?.joinDate && (
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Calendar className="h-3 w-3 text-primary" />
                  <span>Tham gia từ {formatJoinDate(user.joinDate)}</span>
                </span>
              )}
              {(user?.roles ?? []).map((role) => (
                <Badge key={role} variant="outline" className="text-[10px]">
                  {ROLE_LABELS[role] ?? role}
                </Badge>
              ))}
            </div>
          </div>

          <Button asChild variant="outline" size="sm" className="gap-2 text-xs border-border/60 shrink-0">
            <Link to="/my-bookings">
              <Ticket className="h-3.5 w-3.5 text-primary" />
              <span>Xem lịch sử đặt vé</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </section>

      <div
        role="tablist"
        aria-label="Các danh mục quản lý tài khoản"
        className="grid grid-cols-2 gap-1.5 w-full rounded-2xl border border-border/60 bg-card/70 p-1.5 backdrop-blur-md"
      >
        <button type="button" role="tab" aria-selected={activeTab === 'profile'} onClick={() => setActiveTab('profile')} className={tabClass('profile')}>
          <User className="h-4 w-4 shrink-0" />
          <span className="truncate">Thông tin cá nhân</span>
        </button>
        <button type="button" role="tab" aria-selected={activeTab === 'security'} onClick={() => setActiveTab('security')} className={tabClass('security')}>
          <Shield className="h-4 w-4 shrink-0" />
          <span className="truncate">Bảo mật &amp; Cài đặt</span>
        </button>
      </div>

      {activeTab === 'profile' && (
        <div className="rounded-3xl border border-border/70 bg-card/85 p-6 sm:p-8 shadow-lg backdrop-blur-md space-y-6">
          <div className="space-y-1 border-b border-border/40 pb-4">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Thông Tin Tài Khoản</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Cập nhật họ tên và số điện thoại liên hệ của bạn.</p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Họ và tên */}
              <FormField
                label="Họ và tên"
                id="profile-fullname"
                required
                error={profileErrors.fullName}
              >
                <Input
                  id="profile-fullname"
                  type="text"
                  value={fullName}
                  error={profileErrors.fullName}
                  onChange={(e) => {
                    setProfileForm((prev) => ({ ...prev, fullName: e.target.value }))
                    if (profileErrors.fullName) {
                      setProfileErrors((prev) => ({ ...prev, fullName: undefined }))
                    }
                  }}
                  placeholder="Nguyễn Văn An"
                />
              </FormField>

              {/* Email (readonly) */}
              <FormField label="Địa chỉ Email" id="profile-email" required>
                <div className="relative">
                  <Input
                    id="profile-email"
                    type="email"
                    value={user?.email ?? ''}
                    disabled
                    className="bg-secondary/40"
                  />
                </div>
              </FormField>

              {/* Số điện thoại */}
              <FormField
                label="Số điện thoại"
                id="profile-phone"
                error={profileErrors.phone}
              >
                <Input
                  id="profile-phone"
                  type="tel"
                  value={phone}
                  error={profileErrors.phone}
                  onChange={(e) => {
                    setProfileForm((prev) => ({ ...prev, phone: e.target.value }))
                    if (profileErrors.phone) {
                      setProfileErrors((prev) => ({ ...prev, phone: undefined }))
                    }
                  }}
                  placeholder="0912 345 678"
                />
              </FormField>

            </div>

            {/* Nút lưu */}
            <div className="pt-4 border-t border-border/40 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                loading={isSavingProfile}
                disabled={isSavingProfile}
                className="font-bold px-6 shadow-sm shadow-primary/20"
              >
                <span>{isSavingProfile ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Form đổi mật khẩu */}
          <div className="rounded-3xl border border-border/70 bg-card/85 p-6 sm:p-8 shadow-lg backdrop-blur-md space-y-6">
            <div className="space-y-1 border-b border-border/40 pb-4">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                <span>Đổi Mật Khẩu</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Hãy dùng mật khẩu mạnh. Sau khi đổi, các phiên đăng nhập trên thiết bị khác sẽ bị đăng xuất.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <FormField
                label="Mật khẩu hiện tại"
                id="current-pw"
                required
                error={passwordErrors.currentPassword}
              >
                <Input
                  id="current-pw"
                  type="password"
                  value={currentPassword}
                  error={passwordErrors.currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value)
                    if (passwordErrors.currentPassword) {
                      setPasswordErrors((prev) => ({ ...prev, currentPassword: undefined }))
                    }
                  }}
                  placeholder="••••••••"
                />
              </FormField>

              <FormField
                label="Mật khẩu mới"
                id="new-pw"
                required
                error={passwordErrors.newPassword}
              >
                <Input
                  id="new-pw"
                  type="password"
                  value={newPassword}
                  error={passwordErrors.newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    if (passwordErrors.newPassword) {
                      setPasswordErrors((prev) => ({ ...prev, newPassword: undefined }))
                    }
                  }}
                  placeholder="Tối thiểu 6 ký tự"
                />
              </FormField>

              <FormField
                label="Xác nhận mật khẩu mới"
                id="confirm-pw"
                required
                error={passwordErrors.confirmPassword}
              >
                <Input
                  id="confirm-pw"
                  type="password"
                  value={confirmPassword}
                  error={passwordErrors.confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (passwordErrors.confirmPassword) {
                      setPasswordErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                    }
                  }}
                  placeholder="Nhập lại mật khẩu mới"
                />
              </FormField>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  loading={isChangingPassword}
                  disabled={isChangingPassword}
                  className="font-bold cursor-pointer"
                >
                  <span>{isChangingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</span>
                </Button>
              </div>
            </form>
          </div>


          {/* Đăng xuất */}
          <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Đăng xuất khỏi tài khoản</h3>
              <p className="text-xs text-muted-foreground">
                Kết thúc phiên đăng nhập của bạn trên trình duyệt này.
              </p>
            </div>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setLogoutDialogOpen(true)}
              className="gap-2 font-bold cursor-pointer shrink-0"
            >
              <LogOut className="h-4 w-4" />
              <span>Đăng xuất</span>
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={logoutDialogOpen}
        title="Đăng xuất khỏi tài khoản?"
        description="Bạn có chắc chắn muốn đăng xuất khỏi tài khoản CineBook không? Phiên làm việc hiện tại sẽ kết thúc."
        confirmText="Đăng xuất"
        cancelText="Ở lại"
        variant="destructive"
        onConfirm={confirmLogout}
        onCancel={() => setLogoutDialogOpen(false)}
      />
    </div>
  )
}
