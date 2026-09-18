import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  User,
  Crown,
  Ticket,
  Percent,
  Shield,
  Calendar,
  Mail,
  Sparkles,
  Camera,
  CheckCircle2,
  LogOut,
  Gift,
  ArrowRight,
  Clock,
  KeyRound,
} from 'lucide-react'
import { MembershipCard } from '@/components/profile/membership-card'
import { CopyButton } from '@/components/ui/copy-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { FormField } from '@/components/ui/form-field'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  MOCK_USER_PROFILE,
  MOCK_MEMBERSHIP_INFO,
  MOCK_POINT_HISTORY,
  MOCK_REWARDS,
  MOCK_VOUCHERS,
  type UserProfile,
  type MembershipInfo,
  type RewardItem,
} from '@/mocks/user'
import { useAuth } from '@/context/auth-context'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

type ProfileTab = 'profile' | 'membership' | 'vouchers' | 'security'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout, updateProfile } = useAuth()
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile')

  // 1. Dữ liệu form người dùng chỉnh sửa
  const [profileForm, setProfileForm] = useState<{
    fullName?: string
    phone?: string
    birthday?: string
  }>({})

  // Profile hoàn chỉnh được suy luận từ MOCK_USER_PROFILE, AuthContext user và profileForm
  const profile = useMemo<UserProfile>(() => {
    return {
      ...MOCK_USER_PROFILE,
      fullName: profileForm.fullName ?? (user?.fullName || MOCK_USER_PROFILE.fullName),
      email: user?.email || MOCK_USER_PROFILE.email,
      phone: profileForm.phone ?? (user?.phone || MOCK_USER_PROFILE.phone),
      birthday: profileForm.birthday ?? MOCK_USER_PROFILE.birthday,
      avatarUrl: user?.avatarUrl || MOCK_USER_PROFILE.avatarUrl,
    }
  }, [user, profileForm])

  const [membership, setMembership] = useState<MembershipInfo>(MOCK_MEMBERSHIP_INFO)
  const [pointHistory, setPointHistory] = useState(MOCK_POINT_HISTORY)
  const [vouchers, setVouchers] = useState(MOCK_VOUCHERS)

  // 2. State cho các Form & Tương tác
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [redeemModalData, setRedeemModalData] = useState<RewardItem | null>(null)
  const [newPromoCode, setNewPromoCode] = useState('')
  const [isApplyingCode, setIsApplyingCode] = useState(false)

  // State Form đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)


  // State lỗi validation biểu mẫu
  const [profileErrors, setProfileErrors] = useState<{
    fullName?: string
    phone?: string
  }>({})

  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string
    newPassword?: string
    confirmPassword?: string
  }>({})

  // Cập nhật tiêu đề trang
  useEffect(() => {
    document.title = 'Hồ sơ cá nhân & Hội viên | CineBook'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Xử lý lưu thông tin cá nhân
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()

    const errors: { fullName?: string; phone?: string } = {}
    if (!profile.fullName || profile.fullName.trim().length < 2) {
      errors.fullName = 'Họ và tên không được để trống (tối thiểu 2 ký tự).'
    }

    const cleanPhone = (profile.phone || '').replace(/\s+/g, '')
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/
    if (!cleanPhone) {
      errors.phone = 'Vui lòng nhập số điện thoại.'
    } else if (!phoneRegex.test(cleanPhone)) {
      errors.phone = 'Số điện thoại không hợp lệ (10 số, vd: 0912 345 678).'
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors)
      toast.error('Vui lòng kiểm tra lại thông tin có lỗi.')
      return
    }

    setProfileErrors({})
    setIsSavingProfile(true)
    setTimeout(() => {
      setIsSavingProfile(false)
      updateProfile({
        fullName: profile.fullName,
        phone: profile.phone,
      })
      toast.success('Cập nhật thông tin cá nhân thành công!')
    }, 500)
  }

  // Xử lý đổi quà bằng CinePoints
  const handleRedeemReward = (reward: RewardItem) => {
    if (membership.points < reward.pointsCost) {
      toast.error(`Bạn cần thêm ${reward.pointsCost - membership.points} điểm để đổi phần quà này.`)
      return
    }
    setRedeemModalData(reward)
  }

  const confirmRedeemReward = () => {
    if (!redeemModalData) return
    const reward = redeemModalData
    const newPoints = membership.points - reward.pointsCost
    setMembership((prev) => ({ ...prev, points: newPoints }))

    const historyId = `ph-redeem-${pointHistory.length + 1}`
    setPointHistory((prev) => [
      {
        id: historyId,
        title: `Đổi quà: ${reward.title}`,
        points: -reward.pointsCost,
        date: 'Vừa xong',
        type: 'REDEEM',
      },
      ...prev,
    ])

    // Nếu là voucher, thêm vào danh sách voucher
    if (reward.category === 'VOUCHER') {
      const voucherNum = vouchers.length + 1
      const newVoucherCode = `REWARD-${1000 + voucherNum * 17}`
      setVouchers((prev) => [
        {
          id: `vc-redeemed-${voucherNum}`,
          code: newVoucherCode,
          title: reward.title,
          discountText: 'Giảm 50.000đ',
          minSpendText: 'Đơn từ 150.000đ',
          expiresAt: '30 ngày tới',
          category: 'DISCOUNT',
        },
        ...prev,
      ])
    }

    toast.success(`Đổi quà thành công! Bạn đã nhận "${reward.title}".`)
  }

  // Xử lý áp dụng mã khuyến mãi mới
  const handleApplyPromoCode = (e: React.FormEvent) => {
    e.preventDefault()
    const code = newPromoCode.trim().toUpperCase()
    if (!code) return

    setIsApplyingCode(true)
    setTimeout(() => {
      setIsApplyingCode(false)
      if (code === 'CINEVIP100' || code === 'WELCOME2026') {
        setVouchers((prev) => [
          {
            id: `vc-promo-${prev.length + 1}`,
            code,
            title: 'Mã Ưu Đãi Thành Viên Mới',
            discountText: 'Giảm 100.000đ',
            minSpendText: 'Đơn từ 200.000đ',
            expiresAt: '31/12/2026',
            category: 'VIP',
          },
          ...prev,
        ])
        setNewPromoCode('')
        toast.success(`Áp dụng mã ${code} thành công! Đã thêm vào Ví Voucher của bạn.`)
      } else {
        toast.error('Mã khuyến mãi không hợp lệ hoặc đã hết hạn sử dụng.')
      }
    }, 600)
  }

  // Xử lý đổi mật khẩu
  const handleChangePassword = (e: React.FormEvent) => {
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
    setTimeout(() => {
      setIsChangingPassword(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Đổi mật khẩu thành công! Hãy dùng mật khẩu mới trong lần đăng nhập sau.')
    }, 800)
  }

  // Xử lý đăng xuất
  const handleLogout = () => {
    setLogoutDialogOpen(true)
  }

  const confirmLogout = () => {
    setLogoutDialogOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* 1. HEADER & PROFILE HERO BANNER */}
      <section aria-label="Thông tin hội viên" className="space-y-6">
        {/* Breadcrumb */}
        <nav aria-label="Đường dẫn trang" className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <span className="text-foreground font-semibold">Tài khoản &amp; Hội viên</span>
        </nav>

        {/* Khối Thông Tin Cá Nhân & Thẻ Hội Viên Hero (Grid 2 cột) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Cột trái (5 cột): Avatar, Tên, Cấp bậc & Thống kê nhanh */}
          <div className="lg:col-span-5 rounded-3xl border border-border/70 bg-card/85 p-6 sm:p-7 shadow-lg backdrop-blur-md space-y-5 flex flex-col justify-between">
            <div className="flex items-start gap-4">
              {/* Avatar người dùng với nút đổi ảnh */}
              <div className="relative h-18 w-18 sm:h-20 sm:w-20 shrink-0 rounded-2xl overflow-hidden border-2 border-primary/40 bg-muted/40 shadow-md">
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => toast.info('Tính năng tải ảnh đại diện đang được kết nối.')}
                  title="Thay đổi ảnh đại diện"
                  className="absolute bottom-1 right-1 h-6 w-6 rounded-lg bg-black/70 text-white flex items-center justify-center hover:bg-primary transition-colors cursor-pointer"
                  aria-label="Thay đổi ảnh đại diện"
                >
                  <Camera className="h-3 w-3" />
                </button>
              </div>

              {/* Tên & Email */}
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-foreground truncate">
                    {profile.fullName}
                  </h1>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                  <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">{profile.email}</span>
                  {profile.isEmailVerified && (
                    <span title="Email đã xác thực" className="shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/20" />
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
                  <Calendar className="h-3 w-3 text-primary" />
                  <span>Hội viên từ {profile.joinDate}</span>
                </div>
              </div>
            </div>

            {/* Chỉ số nhanh (Quick Metrics): Vé đã xem, Điểm thưởng, Voucher */}
            <div className="grid grid-cols-3 gap-2 border-t border-border/40 pt-4 text-center">
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                  Vé đã xem
                </span>
                <span className="font-extrabold text-base sm:text-lg text-foreground">
                  18 <span className="text-xs font-normal text-muted-foreground">vé</span>
                </span>
              </div>

              <div className="space-y-0.5 border-x border-border/40">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                  CinePoints
                </span>
                <span className="font-extrabold text-base sm:text-lg text-amber-400">
                  {membership.points}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                  Voucher
                </span>
                <span className="font-extrabold text-base sm:text-lg text-primary">
                  {vouchers.length} <span className="text-xs font-normal text-muted-foreground">mã</span>
                </span>
              </div>
            </div>

            {/* Link nhanh xem vé của tôi */}
            <Button asChild variant="outline" size="sm" className="w-full gap-2 text-xs border-border/60">
              <Link to="/my-bookings">
                <Ticket className="h-3.5 w-3.5 text-primary" />
                <span>Xem lịch sử đặt vé của tôi</span>
                <ArrowRight className="h-3.5 w-3.5 ml-auto" />
              </Link>
            </Button>
          </div>

          {/* Cột phải (7 cột): Thẻ Hội Viên VIP Kỹ Thuật Số */}
          <div className="lg:col-span-7">
            <MembershipCard
              membership={membership}
              userName={profile.fullName}
              onViewPerks={() => setActiveTab('membership')}
            />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. THANH TAB ĐIỀU HƯỚNG QUẢN LÝ (4 TABS)                                  */}
      {/* ========================================================================= */}
      <div
        role="tablist"
        aria-label="Các danh mục quản lý tài khoản"
        className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full rounded-2xl border border-border/60 bg-card/70 p-1.5 backdrop-blur-md"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'profile'}
          onClick={() => setActiveTab('profile')}
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer text-center',
            activeTab === 'profile'
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
          )}
        >
          <User className="h-4 w-4 shrink-0" />
          <span className="truncate">Thông tin cá nhân</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'membership'}
          onClick={() => setActiveTab('membership')}
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer text-center',
            activeTab === 'membership'
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
          )}
        >
          <Crown className="h-4 w-4 shrink-0" />
          <span className="truncate">Hạng hội viên &amp; Điểm thưởng</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'vouchers'}
          onClick={() => setActiveTab('vouchers')}
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer text-center',
            activeTab === 'vouchers'
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
          )}
        >
          <Percent className="h-4 w-4 shrink-0" />
          <span className="truncate">Ví Voucher &amp; Ưu đãi ({vouchers.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'security'}
          onClick={() => setActiveTab('security')}
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer text-center',
            activeTab === 'security'
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
          )}
        >
          <Shield className="h-4 w-4 shrink-0" />
          <span className="truncate">Bảo mật &amp; Cài đặt</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. NỘI DUNG TỪNG TAB                                                      */}
      {/* ========================================================================= */}

      {/* TAB 1: THÔNG TIN CÁ NHÂN */}
      {activeTab === 'profile' && (
        <div className="rounded-3xl border border-border/70 bg-card/85 p-6 sm:p-8 shadow-lg backdrop-blur-md space-y-6">
          <div className="space-y-1 border-b border-border/40 pb-4">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              Thông Tin Tài Khoản
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Quản lý và cập nhật thông tin liên hệ và ngày sinh của bạn.
            </p>
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
                  value={profile.fullName}
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
                    value={profile.email}
                    disabled
                    className="bg-secondary/40 pr-24"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                    Đã xác thực
                  </span>
                </div>
              </FormField>

              {/* Số điện thoại */}
              <FormField
                label="Số điện thoại"
                id="profile-phone"
                required
                error={profileErrors.phone}
              >
                <Input
                  id="profile-phone"
                  type="tel"
                  value={profile.phone}
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

              {/* Ngày sinh */}
              <FormField
                label="Ngày sinh"
                id="profile-birthday"
              >
                <DatePicker
                  id="profile-birthday"
                  value={profile.birthday}
                  onChange={(dateStr) => setProfileForm((prev) => ({ ...prev, birthday: dateStr }))}
                  maxDate={new Date().toISOString().split('T')[0]}
                  fromYear={1920}
                  toYear={new Date().getFullYear()}
                  placeholder="Chọn ngày sinh của bạn..."
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

      {/* TAB 2: HẠNG HỘI VIÊN & ĐỔI ĐIỂM THƯỞNG */}
      {activeTab === 'membership' && (
        <div className="space-y-8">
          {/* 1. Đổi quà bằng CinePoints */}
          <div className="rounded-3xl border border-border/70 bg-card/85 p-6 sm:p-8 shadow-lg backdrop-blur-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/40 pb-4">
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                  <Gift className="h-5 w-5 text-amber-400" />
                  <span>Đổi Quà Bằng CinePoints</span>
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Số dư hiện tại:{' '}
                  <strong className="text-amber-400 font-extrabold">{membership.points} điểm</strong>{' '}
                  (tương đương {((membership.points * 100)).toLocaleString('vi-VN')}đ).
                </p>
              </div>
            </div>

            {/* Danh mục quà tặng đổi điểm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MOCK_REWARDS.map((reward) => {
                const canAfford = membership.points >= reward.pointsCost
                return (
                  <div
                    key={reward.id}
                    className="flex flex-col justify-between rounded-2xl border border-border/60 bg-secondary/30 p-4 sm:p-5 transition-all hover:border-border/80"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm text-foreground">{reward.title}</h3>
                        <span className="shrink-0 font-mono text-sm font-black text-amber-400">
                          {reward.pointsCost} pts
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {reward.description}
                      </p>
                    </div>

                    <div className="pt-4 mt-2 border-t border-border/30 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        {canAfford ? (
                          <span className="text-emerald-500 font-medium flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Đủ điểm đổi quà
                          </span>
                        ) : (
                          <span>Thiếu {reward.pointsCost - membership.points} điểm</span>
                        )}
                      </span>

                      <Button
                        type="button"
                        variant={canAfford ? 'primary' : 'outline'}
                        size="sm"
                        disabled={!canAfford}
                        onClick={() => handleRedeemReward(reward)}
                        className="text-xs font-bold"
                      >
                        Đổi ngay
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 2. Đặc quyền hạng thẻ VIP Diamond */}
          <div className="rounded-3xl border border-border/70 bg-card/85 p-6 sm:p-8 shadow-lg backdrop-blur-md space-y-5">
            <div className="space-y-1 border-b border-border/40 pb-4">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-400" />
                <span>Đặc Quyền Thành Viên {membership.tierName}</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Tận hưởng trọn vẹn những ưu đãi nghe nhìn và dịch vụ tốt nhất tại rạp.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {membership.benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-start gap-3 rounded-xl border border-border/40 bg-secondary/25 p-3.5 text-xs text-foreground/90"
                >
                  <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Lịch sử điểm CinePoints */}
          <div className="rounded-3xl border border-border/70 bg-card/85 p-6 sm:p-8 shadow-lg backdrop-blur-md space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>Lịch Sử Điểm Thưởng Gần Đây</span>
            </h2>

            <div className="divide-y divide-border/40">
              {pointHistory.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-semibold text-foreground line-clamp-1">{item.title}</p>
                    <span className="text-[11px] text-muted-foreground">{item.date}</span>
                  </div>
                  <span
                    className={cn(
                      'font-mono font-black text-sm shrink-0',
                      item.points > 0 ? 'text-emerald-500' : 'text-destructive'
                    )}
                  >
                    {item.points > 0 ? `+${item.points}` : item.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VÍ VOUCHER & ƯU ĐÃI */}
      {activeTab === 'vouchers' && (
        <div className="space-y-6">
          {/* Ô nhập mã khuyến mãi mới */}
          <div className="rounded-3xl border border-border/70 bg-card/85 p-6 shadow-lg backdrop-blur-md">
            <form onSubmit={handleApplyPromoCode} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  value={newPromoCode}
                  onChange={(e) => setNewPromoCode(e.target.value)}
                  placeholder="Nhập mã voucher (Thử: CINEVIP100)..."
                  className="bg-background/80 uppercase font-mono tracking-wider text-xs sm:text-sm h-11"
                  aria-label="Mã khuyến mãi"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                loading={isApplyingCode}
                disabled={isApplyingCode || !newPromoCode.trim()}
                className="h-11 font-bold px-6 cursor-pointer shrink-0"
              >
                <span>Áp dụng mã</span>
              </Button>
            </form>
          </div>

          {/* Danh sách voucher đang sở hữu */}
          <div className="space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              Phiếu Giảm Giá Khả Dụng ({vouchers.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {vouchers.map((vc) => (
                <div
                  key={vc.id}
                  className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-xs flex flex-col justify-between space-y-4 transition-all hover:border-primary/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <Badge variant="secondary" className="text-[10px] font-bold">
                        {vc.category === 'VIP' ? 'Đặc quyền VIP' : 'Khuyến mãi online'}
                      </Badge>
                      <h3 className="text-base font-bold text-foreground">{vc.title}</h3>
                      <p className="text-lg font-black text-primary">{vc.discountText}</p>
                      <p className="text-xs text-muted-foreground">{vc.minSpendText}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/50 px-2.5 py-1">
                        <span className="font-mono text-xs font-black tracking-wider text-foreground">
                          {vc.code}
                        </span>
                        <CopyButton text={vc.code} title="Sao chép mã voucher" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border/30 pt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Hạn sử dụng: <strong>{vc.expiresAt}</strong></span>
                    <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-primary hover:text-primary p-0">
                      <Link to="/movies">
                        <span>Dùng ngay</span>
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BẢO MẬT & CÀI ĐẶT */}
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
                Để bảo vệ an toàn cho tài khoản, hãy sử dụng mật khẩu mạnh có chứa chữ hoa, số và ký tự đặc biệt.
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
              onClick={handleLogout}
              className="gap-2 font-bold cursor-pointer shrink-0"
            >
              <LogOut className="h-4 w-4" />
              <span>Đăng xuất</span>
            </Button>
          </div>
        </div>
      )}

      {/* Modal xác nhận Đăng xuất */}
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

      {/* Modal xác nhận Đổi quà */}
      <ConfirmDialog
        isOpen={Boolean(redeemModalData)}
        title="Xác nhận đổi quà thưởng"
        description={
          redeemModalData
            ? `Bạn có chắc chắn muốn dùng ${redeemModalData.pointsCost} CinePoints để đổi "${redeemModalData.title}" không?`
            : ''
        }
        confirmText="Đổi quà ngay"
        cancelText="Hủy"
        variant="info"
        onConfirm={confirmRedeemReward}
        onCancel={() => setRedeemModalData(null)}
      />
    </div>
  )
}
