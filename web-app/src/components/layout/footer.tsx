import { Link } from 'react-router-dom'
import { Film } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      role="contentinfo"
      aria-label="Chân trang CineBook"
      className="w-full border-t border-border/40 bg-card/25 text-muted-foreground"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Cột 1: CineBook Branding */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 text-xl font-bold tracking-tight text-foreground transition-opacity hover:opacity-90 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
              aria-label="CineBook - Về trang chủ"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/30">
                <Film className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="font-extrabold tracking-tight">
                Cine<span className="text-primary">Book</span>
              </span>
            </Link>

            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Nền tảng đặt vé xem phim trực tuyến hiện đại. Cập nhật lịch chiếu nhanh chóng, lựa chọn chỗ ngồi thông minh và trải nghiệm thanh toán an toàn, tiện lợi.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="CineBook trên Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-secondary/50 text-muted-foreground transition-all hover:border-primary/50 hover:bg-secondary hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="CineBook trên Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-secondary/50 text-muted-foreground transition-all hover:border-primary/50 hover:bg-secondary hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="CineBook trên YouTube"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-secondary/50 text-muted-foreground transition-all hover:border-primary/50 hover:bg-secondary hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>

              {/* X (Twitter) */}
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="CineBook trên X"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-secondary/50 text-muted-foreground transition-all hover:border-primary/50 hover:bg-secondary hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Cột 2: Khám phá */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">
              Khám phá
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/movies"
                  className="transition-colors hover:text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  Phim đang chiếu
                </Link>
              </li>
              <li>
                <Link
                  to="/movies"
                  className="transition-colors hover:text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  Phim sắp chiếu
                </Link>
              </li>
              <li>
                <Link
                  to="/cinemas"
                  className="transition-colors hover:text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  Rạp chiếu
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Hỗ trợ */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">
              Hỗ trợ
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="#faq"
                  className="transition-colors hover:text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="transition-colors hover:text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  Liên hệ
                </a>
              </li>
              <li>
                <a
                  href="#terms"
                  className="transition-colors hover:text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  Điều khoản
                </a>
              </li>
              <li>
                <a
                  href="#privacy"
                  className="transition-colors hover:text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  Chính sách bảo mật
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Dòng dưới cùng: Copyright */}
        <div className="mt-12 border-t border-border/40 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            &copy; {currentYear} <span className="font-medium text-foreground">CineBook</span>. All rights reserved.
          </p>
          <p className="text-muted-foreground/80">
            Hệ thống đặt vé xem phim trực tuyến Demo Microservices + Kafka
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
