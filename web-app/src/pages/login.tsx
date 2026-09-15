import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Film,
  Sparkles,
  ShieldCheck,
  Ticket,
  Clapperboard,
  Star,
  Users,
} from 'lucide-react'
import { LoginForm } from '@/components/auth/login-form'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { LoginFormData } from '@/types/auth'

import { useAuth } from '@/context/auth-context'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, user, logout } = useAuth()
  const from = (location.state as { from?: string } | null)?.from || '/'

  const [formKey, setFormKey] = useState(0)
  const [defaultEmail, setDefaultEmail] = useState('')
  const [defaultPassword, setDefaultPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)

  // Cập nhật title trình duyệt khi truy cập trang Login
  useEffect(() => {
    document.title = 'Đăng nhập | CineBook'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Xử lý đăng nhập thực tế với AuthContext
  const handleLogin = async (data: LoginFormData) => {
    setIsLoggingIn(true)
    const success = await login(data)
    setIsLoggingIn(false)

    if (success) {
      setLoginSuccess(true)
      // Chuyển hướng sau khi thông báo thành công
      setTimeout(() => {
        navigate(from, { replace: true })
      }, 600)
    }
  }

  // Điền tài khoản thử nghiệm nhanh (cả Email và Mật khẩu)
  const fillDemoAccount = () => {
    setDefaultEmail('demo@cinebook.vn')
    setDefaultPassword('123456')
    setFormKey((prev) => prev + 1)
  }

  return (
    <div className="relative min-h-[calc(100vh-10rem)] flex items-center justify-center py-6 sm:py-10">
      {/* 1. Cinematic Ambient Backdrop (Tối ưu độ tương phản, chống chói/rối chữ) */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Ảnh nền không gian rạp chiếu phim mờ ảo */}
        <img
          src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop&q=80"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center opacity-10 dark:opacity-20 transition-opacity"
        />

        {/* Lớp phủ đa tầng (Heavy Scrims) đảm bảo chữ luôn sắc nét và cực kỳ dễ đọc */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/95" />
        <div className="absolute inset-0 bg-radial-[at_top_right] from-primary/15 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-radial-[at_bottom_left] from-primary/10 via-transparent to-transparent" />
      </div>

      {/* 2. Bố cục xác thực Cinematic 2 cột trên Desktop, 1 cột tập trung trên Mobile */}
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-16 items-center">
        {/* Cột trái: Cinematic Branding & Đặc quyền thành viên (Desktop) */}
        <div className="hidden lg:flex lg:col-span-7 flex-col space-y-8 pr-2 xl:pr-6">
          {/* Badge nhận diện */}
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur-md shadow-sm">
            <Film className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Cổng Đăng Nhập Thành Viên CineBook</span>
          </div>

          {/* Tiêu đề điện ảnh */}
          <div className="space-y-3">
            <h1 className="text-3xl xl:text-5xl font-black tracking-tight text-foreground leading-[1.15]">
              Đắm chìm trong từng khoảnh khắc{' '}
              <span className="bg-gradient-to-r from-primary via-red-500 to-amber-500 bg-clip-text text-transparent">
                Điện Ảnh
              </span>
            </h1>
            <p className="text-base xl:text-lg text-muted-foreground leading-relaxed max-w-xl">
              Đăng nhập để giữ chỗ theo thời gian thực, xem lại vé đã đặt, lưu rạp chiếu yêu thích
              và tích lũy điểm thưởng thành viên CineClub.
            </p>
          </div>

          {/* Danh sách quyền lợi nổi bật */}
          <div className="grid grid-cols-1 gap-4 pt-2">
            <div className="flex items-start gap-4 rounded-2xl border border-border/50 bg-card/60 p-4 backdrop-blur-sm transition-all hover:bg-card/80 hover:border-primary/40">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Ticket className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Giữ ghế Real-time 30s</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Cập nhật tức thì trạng thái sơ đồ ghế thông qua hệ thống phân tán thời gian thực.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-border/50 bg-card/60 p-4 backdrop-blur-sm transition-all hover:bg-card/80 hover:border-primary/40">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Thanh toán an toàn đa kênh</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Hỗ trợ liền mạch VNPay, MoMo, ZaloPay và thẻ quốc tế với mã vé điện tử tức thì.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-border/50 bg-card/60 p-4 backdrop-blur-sm transition-all hover:bg-card/80 hover:border-primary/40">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Đặc quyền CineRewards</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Tích lũy điểm cho mỗi vé đặt để đổi bắp nước miễn phí và vé xem phim ưu đãi.
                </p>
              </div>
            </div>
          </div>

          {/* Social Proof Mini Banner */}
          <div className="flex items-center gap-4 rounded-2xl border border-border/40 bg-card/40 px-5 py-3.5 backdrop-blur-xs text-xs text-muted-foreground">
            <div className="flex -space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary border-2 border-background font-bold text-[10px]">
                CB
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/20 text-warning border-2 border-background font-bold text-[10px]">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary border-2 border-background font-bold text-[10px]">
                <Users className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <span className="font-semibold text-foreground">Hơn 50.000+ khán giả</span> đã đặt vé
              thành công tại hệ thống CineBook trong tuần này.
            </div>
          </div>
        </div>

        {/* Cột phải: Khối Authentication Card tái sử dụng LoginForm */}
        <div className="w-full max-w-md mx-auto lg:col-span-5 lg:max-w-none">
          {/* Card Header & Brand Icon */}
          <div className="text-center mb-6 space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 mb-1">
              <Clapperboard className="h-6 w-6" aria-hidden="true" />
            </div>
            {/* Đảm bảo có h1 chuẩn SEO và Accessibility trên cả Mobile lẫn Desktop */}
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground lg:hidden">
              Đăng nhập tài khoản
            </h1>
            <h2 className="hidden lg:block text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Đăng nhập tài khoản
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Chào mừng bạn trở lại! Nhập thông tin để tiếp tục trải nghiệm.
            </p>
          </div>

          {/* Thông báo đăng nhập thành công */}
          {loginSuccess && (
            <Alert variant="success" className="mb-5">
              <div className="font-medium">
                Đăng nhập thành công! Đang chuyển hướng về trang bạn yêu cầu...
              </div>
            </Alert>
          )}

          {/* Nếu người dùng đã đăng nhập từ trước */}
          {isAuthenticated && user && !loginSuccess && (
            <div className="mb-5 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span>Bạn đang đăng nhập: <strong className="text-foreground">{user.fullName || user.email || 'Thành viên'}</strong></span>
                <button
                  type="button"
                  onClick={logout}
                  className="font-bold text-destructive hover:underline cursor-pointer"
                >
                  Đăng xuất
                </button>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full text-xs">
                <Link to="/profile">Đi tới trang Hồ sơ cá nhân</Link>
              </Button>
            </div>
          )}

          {/* Reusable LoginForm */}
          <LoginForm
            key={formKey}
            onSubmit={handleLogin}
            defaultEmail={defaultEmail}
            defaultPassword={defaultPassword}
            loading={isLoggingIn}
            className="shadow-2xl border-border/80 bg-card/90"
          />

          {/* Hint tài khoản Demo tiện lợi */}
          <div className="mt-5 rounded-2xl border border-dashed border-border/70 bg-card/40 p-4 backdrop-blur-xs text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="space-y-0.5 text-center sm:text-left">
              <span className="font-semibold text-foreground">Tài khoản trải nghiệm nhanh:</span>
              <div className="text-[11px] text-muted-foreground/90">
                demo@cinebook.vn &bull; Mật khẩu: 123456
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fillDemoAccount}
              className="shrink-0 text-xs font-medium"
            >
              Điền mẫu ngay
            </Button>
          </div>

          {/* Điều khoản & bảo mật nhỏ chân form */}
          <div className="mt-6 text-center text-[11px] text-muted-foreground/80 leading-relaxed px-4">
            Bằng việc tiếp tục, bạn đồng ý với{' '}
            <Link to="/terms" className="underline hover:text-foreground">
              Điều khoản CineBook
            </Link>{' '}
            và{' '}
            <Link to="/privacy" className="underline hover:text-foreground">
              Chính sách bảo mật
            </Link>
            .
          </div>
        </div>
      </div>
    </div>
  )
}
