import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Home, Film, Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  // Cập nhật tiêu đề trình duyệt khi truy cập trang 404
  useEffect(() => {
    document.title = '404 - Không tìm thấy trang | CineBook'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <div className="relative min-h-[calc(100vh-14rem)] flex items-center justify-center py-12 sm:py-20">
      {/* 1. Cinematic Ambient Lighting (Hiệu ứng ánh sáng rạp phim huyền ảo nhưng đơn giản) */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
        <div className="h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute h-48 w-48 rounded-full bg-red-600/5 blur-2xl -translate-y-12" />
      </div>

      <div className="w-full max-w-lg mx-auto text-center px-4 space-y-6">
        {/* 2. Con số 404 phong cách Điện Ảnh */}
        <div className="relative inline-block select-none">
          <span className="text-8xl sm:text-9xl font-black tracking-tighter bg-gradient-to-b from-primary via-primary/70 to-primary/10 bg-clip-text text-transparent drop-shadow-sm">
            404
          </span>
          <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-secondary/90 border border-border/60 text-primary shadow-md backdrop-blur-md rotate-12">
            <Compass className="h-5 w-5 sm:h-6 sm:w-6 animate-spin-slow" aria-hidden="true" />
          </div>
        </div>

        {/* 3. Tiêu đề và nội dung thông báo theo đặc tả Task 42 */}
        <div className="space-y-2.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Không tìm thấy trang.
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            Đường dẫn bạn yêu cầu không tồn tại, đã bị thay đổi hoặc phim đã ngừng chiếu. Hãy quay về
            trang chủ hoặc khám phá các bộ phim bom tấn mới nhất.
          </p>
        </div>

        {/* 4. Hai hành động chính theo đặc tả: "Về trang chủ" & "Xem phim đang chiếu" */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
          {/* Action 1: Về trang chủ */}
          <Button
            asChild
            variant="primary"
            size="lg"
            className="w-full sm:w-auto font-bold shadow-xl shadow-primary/25 transition-transform hover:scale-105 active:scale-95"
          >
            <Link to="/">
              <Home className="h-4 w-4 mr-2" aria-hidden="true" />
              <span>Về trang chủ</span>
            </Link>
          </Button>

          {/* Action 2: Xem phim đang chiếu */}
          <Button
            asChild
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto font-semibold border border-border/70 hover:bg-secondary/90 transition-transform hover:scale-105 active:scale-95"
          >
            <Link to="/movies">
              <Film className="h-4 w-4 mr-2 text-primary" aria-hidden="true" />
              <span>Xem phim đang chiếu</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
