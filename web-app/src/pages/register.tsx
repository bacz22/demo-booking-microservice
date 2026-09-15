import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Film,
  Sparkles,
  Gift,
  Crown,
  Zap,
  Star,
  Users,
  UserPlus,
} from 'lucide-react'
import { RegisterForm } from '@/components/auth/register-form'
import { Alert } from '@/components/ui/alert'
import type { RegisterFormData } from '@/types/auth'
import { useAuth } from '@/context/auth-context'

export default function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { register } = useAuth()
  const from = (location.state as { from?: string } | null)?.from || '/'

  const [isRegistering, setIsRegistering] = useState(false)
  const [registerSuccess, setRegisterSuccess] = useState(false)

  // Cập nhật title trình duyệt khi truy cập trang Register
  useEffect(() => {
    document.title = 'Đăng ký tài khoản | CineBook'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Xử lý đăng ký với AuthContext
  const handleRegister = async (data: RegisterFormData) => {
    setIsRegistering(true)
    const success = await register(data)
    setIsRegistering(false)

    if (success) {
      setRegisterSuccess(true)
      // Chuyển hướng sau khi thông báo thành công
      setTimeout(() => {
        navigate(from, { replace: true })
      }, 700)
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-10rem)] flex items-center justify-center py-6 sm:py-10">
      {/* 1. Cinematic Ambient Backdrop (Đồng bộ Login Page, bảo vệ độ tương phản chữ) */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop&q=80"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center opacity-10 dark:opacity-20 transition-opacity"
        />

        {/* Lớp phủ đa tầng (Heavy Scrims) chống chói và giúp chữ luôn sắc nét */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/95" />
        <div className="absolute inset-0 bg-radial-[at_top_left] from-primary/15 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-radial-[at_bottom_right] from-primary/10 via-transparent to-transparent" />
      </div>

      {/* 2. Bố cục xác thực Cinematic 2 cột trên Desktop, 1 cột trên Mobile */}
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-16 items-center">
        {/* Cột trái: Cinematic Branding & Đặc quyền dành cho thành viên mới (Desktop) */}
        <div className="hidden lg:flex lg:col-span-7 flex-col space-y-8 pr-2 xl:pr-6">
          {/* Badge nhận diện */}
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur-md shadow-sm">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Cổng Đăng Ký Thành Viên Mới</span>
          </div>

          {/* Tiêu đề phong cách điện ảnh */}
          <div className="space-y-3">
            <h1 className="text-3xl xl:text-5xl font-black tracking-tight text-foreground leading-[1.15]">
              Gia nhập thế giới{' '}
              <span className="bg-gradient-to-r from-primary via-red-500 to-amber-500 bg-clip-text text-transparent">
                Điện Ảnh Đỉnh Cao
              </span>
            </h1>
            <p className="text-base xl:text-lg text-muted-foreground leading-relaxed max-w-xl">
              Tạo tài khoản CineBook hoàn toàn miễn phí chỉ trong 1 phút để nhận ngay combo ưu đãi
              chào mừng thành viên mới và đặc quyền giữ ghế VIP thời gian thực.
            </p>
          </div>

          {/* Danh sách 3 đặc quyền thành viên mới */}
          <div className="grid grid-cols-1 gap-4 pt-2">
            <div className="flex items-start gap-4 rounded-2xl border border-border/50 bg-card/60 p-4 backdrop-blur-sm transition-all hover:bg-card/80 hover:border-primary/40">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Gift className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Gói quà chào mừng 200k</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Nhận ngay voucher giảm giá vé và ưu đãi combo bắp rang nước ngọt cho đơn hàng đầu tiên.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-border/50 bg-card/60 p-4 backdrop-blur-sm transition-all hover:bg-card/80 hover:border-primary/40">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Crown className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Tích điểm CineClub không giới hạn</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Tích lũy 10% giá trị mỗi vé xem phim để thăng hạng VIP và đổi vé xem phim 0đ vào tháng sinh nhật.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-border/50 bg-card/60 p-4 backdrop-blur-sm transition-all hover:bg-card/80 hover:border-primary/40">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Zap className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Đặt vé nhanh 1 chạm</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Lưu rạp chiếu yêu thích, theo dõi lịch sử vé đã đặt và thanh toán không cần chờ đợi xếp hàng.
                </p>
              </div>
            </div>
          </div>

          {/* Social Proof Mini Banner */}
          <div className="flex items-center gap-4 rounded-2xl border border-border/40 bg-card/40 px-5 py-3.5 backdrop-blur-xs text-xs text-muted-foreground">
            <div className="flex -space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary border-2 border-background font-bold text-[10px]">
                <Film className="h-4 w-4" />
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/20 text-warning border-2 border-background font-bold text-[10px]">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary border-2 border-background font-bold text-[10px]">
                <Users className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <span className="font-semibold text-foreground">Hơn 120.000+ thành viên</span> đã
              đăng ký và tin tưởng lựa chọn đặt vé tại CineBook.
            </div>
          </div>
        </div>

        {/* Cột phải: Khối Authentication Card tái sử dụng RegisterForm */}
        <div className="w-full max-w-md mx-auto lg:col-span-5 lg:max-w-none">
          {/* Card Header & Brand Icon */}
          <div className="text-center mb-6 space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 mb-1">
              <UserPlus className="h-6 w-6" aria-hidden="true" />
            </div>
            {/* Đảm bảo có h1 chuẩn SEO và Accessibility trên cả Mobile lẫn Desktop */}
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground lg:hidden">
              Đăng ký tài khoản
            </h1>
            <h2 className="hidden lg:block text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Đăng ký tài khoản
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Bắt đầu hành trình điện ảnh của bạn ngay hôm nay.
            </p>
          </div>

          {/* Thông báo đăng ký thành công giả lập */}
          {registerSuccess && (
            <Alert variant="success" className="mb-5">
              <div className="font-medium">
                Đăng ký tài khoản thành công! Đang chuyển hướng sang đăng nhập...
              </div>
            </Alert>
          )}

          {/* Reusable RegisterForm */}
          <RegisterForm
            onSubmit={handleRegister}
            loading={isRegistering}
            className="shadow-2xl border-border/80 bg-card/90"
          />

          {/* Điều khoản & bảo mật chân form */}
          <div className="mt-6 text-center text-[11px] text-muted-foreground/80 leading-relaxed px-4">
            Bằng việc nhấn Đăng ký, bạn đồng ý với{' '}
            <Link to="/terms" className="underline hover:text-foreground">
              Điều khoản dịch vụ
            </Link>{' '}
            và{' '}
            <Link to="/privacy" className="underline hover:text-foreground">
              Chính sách bảo mật
            </Link>{' '}
            của CineBook.
          </div>
        </div>
      </div>
    </div>
  )
}
